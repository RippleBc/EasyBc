const CounterData = require("../data/counter");
const utils = require("../../../depends/utils");
const { TRANSACTIONS_CONSENSUS_THRESHOULD, CHEAT_REASON_COUNTER_DATA_INVALID_TIMESTAMP, CHEAT_REASON_REPEATED_COUNTER_DATA, CHEAT_REASON_INVALID_COUNTER_ACTION, RIPPLE_STAGE_AMALGAMATE_FETCHING_NEW_TRANSACTIONS, COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE, COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE, RIPPLE_STATE_PERISH_NODE, COUNTER_CONSENSUS_STAGE_TRIGGER_MAX_SIZE, PROTOCOL_CMD_COUNTER_FINISH_STATE_REQUEST, PROTOCOL_CMD_COUNTER_FINISH_STATE_RESPONSE, RIPPLE_STATE_STAGE_CONSENSUS, COUNTER_CONSENSUS_STAGE_TRIGGER_THRESHOULD, COUNTER_HANDLER_TIME_DETAY, COUNTER_INVALID_STAGE_TIME_SECTION, STAGE_STATE_EMPTY, RIPPLE_STAGE_AMALGAMATE, RIPPLE_STAGE_CANDIDATE_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE, PROTOCOL_CMD_STAGE_INFO_REQUEST, PROTOCOL_CMD_STAGE_INFO_RESPONSE } = require("../../constant");
const Stage = require("./stage");
const assert = require("assert");
const _ = require("underscore");

const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerStageConsensus")];
const privateKey = process[Symbol.for("privateKey")];
const unl = process[Symbol.for("unl")];
const mysql = process[Symbol.for("mysql")];

const COUNTER_DATA_TIMESTAMP_CHEATED_LEFT_GAP = 60 * 1000;
const COUNTER_DATA_TIMESTAMP_CHEATED_RIGHT_GAP = 60 * 1000;

const COUNTER_DATA_TIMESTAMP_STOP_SPREAD_LEFT_GAP = 30 * 1000;
const COUNTER_DATA_TIMESTAMP_STOP_SPREAD_RIGHT_GAP = 30 * 1000;

class Counter extends Stage
{
	constructor(ripple)
	{
		super({
			name: 'counter',
			synchronize_state_request_cmd: PROTOCOL_CMD_COUNTER_FINISH_STATE_REQUEST,
			synchronize_state_response_cmd: PROTOCOL_CMD_COUNTER_FINISH_STATE_RESPONSE
		});

		this.ripple = ripple;

		this.counterDatas = [];
		this.stageSynchronizeTrigger = [];
	}

	reset()
	{
		super.reset();

		this.counterDatas = [];
		this.stageSynchronizeTrigger = [];
	}

	handler(ifSuccess)
	{
		const actionCollsMap = new Map();

		for(let counterData of this.counterDatas)
		{
			const action = bufferToInt(counterData.action);

			if(actionCollsMap.has(action))
			{
				const count = actionCollsMap.get(action);
				actionCollsMap.set(action, count + 1);
			}
			else
			{
				actionCollsMap.set(action, 1);
			}
		}

		// statistic vote result
		const sortedActionColls = _.sortBy([...actionCollsMap], actionColl => -actionColl[1]);

		if(sortedActionColls[0] && sortedActionColls[0][1] / (unl.length + 1) >= TRANSACTIONS_CONSENSUS_THRESHOULD)
		{
			const action = sortedActionColls[0][0];

			if(action === COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE)
			{
				logger.info("Counter handler, stage synchronize success, begin to fetch new transaction and amalgamate")

				this.ripple.stage = RIPPLE_STAGE_AMALGAMATE_FETCHING_NEW_TRANSACTIONS;

				this.ripple.run(false).then(() => {

					// handle cached messages
					for(let i = 0; i < this.ripple.amalgamateMessagesCache.length; i++)
					{
						let {address, cmd, data} = this.ripple.amalgamateMessagesCache[i];
						this.ripple.amalgamate.handleMessage(address, cmd, data);
					}

					this.ripple.amalgamateMessagesCache = [];		

				}).catch(e => {
					logger.fatal(`Counter handler, throw exception, ${process[Symbol.for("getStackInfo")](e)}`);

					process.exit(1);
				});
			}
			else if(action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE)
			{
				logger.info("Counter handler, stage synchronize success, begin to reuse cached transactions and amalgamate")

				this.ripple.run(true);
			}
			else
			{
				logger.fatal(`Counter handler, invalid action, ${this.action}`);

				process.exit(1);
			}
		}
		else 
		{
			let counterDataInfo = ""
			for(let counterData of this.counterDatas)
			{
				counterDataInfo += `address: ${counterData.from.toString("hex")}, action: ${bufferToInt(counterData.action)}, `
			}
			counterDataInfo.splice(-1, 1);

			logger.error(`Counter handler, stage sync failed, ${counterDataInfo}`);

			this.ripple.run(true);
		}
		
		this.reset();
	}

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage(address, cmd, data)
	{
		switch(cmd)
		{
			case PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE:
			case PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE:
			case PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE:
			{
				if(this.stageSynchronizeTrigger.length > COUNTER_CONSENSUS_STAGE_TRIGGER_MAX_SIZE * unl.length)
				{
					this.stageSynchronizeTrigger.shift();
				}
				
				const now = Date.now();
				this.stageSynchronizeTrigger.push(now);
			}
			break;
			case PROTOCOL_CMD_STAGE_INFO_REQUEST:
			{
				// there is node begin to sync stage, check if already in sync stage
				if(this.state === STAGE_STATE_EMPTY && this.ripple.state !== RIPPLE_STATE_PERISH_NODE)
				{
					const counterData = new CounterData(data);

					// check timestamp
					const now = Date.now();
					const timestamp = bufferToInt(counterData.timestamp)
					if(timestamp > now + COUNTER_DATA_TIMESTAMP_CHEATED_RIGHT_GAP || timestamp < now - COUNTER_DATA_TIMESTAMP_CHEATED_LEFT_GAP)
					{
						return this.cheatedNodes.push({
							address: address.toString('hex'),
							reason: CHEAT_REASON_COUNTER_DATA_INVALID_TIMESTAMP
						})
					}

					const action = bufferToInt(counterData.action);

					const counterDataHash = counterData.hash().toString("hex");

					mysql.checkIfCounterRepeated(counterDataHash).then(repeated => {
						// counter data is valid, check if already in sync stage
						if(this.state === STAGE_STATE_EMPTY && this.ripple.state !== RIPPLE_STATE_PERISH_NODE)
						{
							if(repeated)
							{
								return this.cheatedNodes.push({
									address: address.toString('hex'),
									reason: CHEAT_REASON_REPEATED_COUNTER_DATA
								})
							}
						
							if(action === COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE)
							{
								logger.info(`Counter handleMessage, begin to synchronize stage negatively, stage: ${this.ripple.stage}, begin to fetch new transactions and amalgamate`);
							}
							else if(action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE)
							{
								logger.info(`Counter handleMessage, begin to synchronize stage negatively, stage: ${this.ripple.stage}, begin to use cached tranasctions and amalgamate`);
							}
							else
							{
								logger.error(`Counter handleMessage, invalid action, ${action}`)

								return this.cheatedNodes.push({
									address: address.toString('hex'),
									reason: CHEAT_REASON_INVALID_COUNTER_ACTION
								})
							}
							// 
							if(timestamp < now + COUNTER_DATA_TIMESTAMP_STOP_SPREAD_RIGHT_GAP && timestamp > now - COUNTER_DATA_TIMESTAMP_STOP_SPREAD_LEFT_GAP)
							{
								this.startStageSynchronize({
									counterData: counterData
								});
							}

							p2p.send(address, PROTOCOL_CMD_STAGE_INFO_RESPONSE, this.counterData.serialize());
						}
					}).catch(e => {
						this.logger.error(e);
					})
				}
				else
				{
					p2p.send(address, PROTOCOL_CMD_STAGE_INFO_RESPONSE, this.counterData.serialize());
				}
			}
			break;
			case PROTOCOL_CMD_STAGE_INFO_RESPONSE:
			{
				if(this.state === STAGE_STATE_EMPTY)
				{
					return;
				}

				const counterData = new CounterData(data);

				this.validateAndProcessExchangeData(counterData, this.counterDatas, address.toString("hex"), {
					addressCheck: false
				});
			}
			break;
			default:
			{
				if(this.state === STAGE_STATE_EMPTY)
				{
					return;
				}

				super.handleMessage(address, cmd, data);
			}
		}
	}

	resetTrigger()
	{
		if(this.state !== STAGE_STATE_EMPTY)
		{
			logger.fatal(`Counter resetTrigger, counter state should be STAGE_STATE_EMPTY, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);
			
			process.exit(1)
		}

		this.stageSynchronizeTrigger = [];
	}

	checkIfTriggered()
	{
		const now = Date.now();

		let stageInvalidFrequency = 0;
		for(let timestamp of this.stageSynchronizeTrigger.reverse())
		{
			if(timestamp + COUNTER_INVALID_STAGE_TIME_SECTION > now)
			{
				stageInvalidFrequency ++;
			}
			else
			{
				break;
			}
		}

		return this.state === STAGE_STATE_EMPTY && stageInvalidFrequency >= COUNTER_CONSENSUS_STAGE_TRIGGER_THRESHOULD * unl.length
	}

	checkIfFetchingNewTransactions()
	{
		return this.ripple.stage === RIPPLE_STAGE_AMALGAMATE_FETCHING_NEW_TRANSACTIONS;
	}

	checkActionIfFetchingNewTransactionsAndAmalgamate()
	{
		return this.action === COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE;
	}

	checkActionIfReuseCachedTransactionsAndAmalgamate()
	{
		return this.action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE;
	}

	/**
	 * @param {Number} action
	 * @param {CounterData} counterData
	 */
	startStageSynchronize({action, counterData})
	{
		if(action === undefined && counterData === undefined)
		{
			throw new Error(`Counter startStageSynchronize, action and counterData can not be undefined at the same time`);
		}
		
		if(counterData)
		{
			assert(counterData instanceof CounterData, `Counter startStageSynchronize, counter data should be an instance of CounterData, now is ${typeof counterData}`);
		}
		else
		{
			assert(typeof action === "number", `Counter startStageSynchronize, action should be a Number, now is ${typeof action}`);
		
			counterData = new CounterData({
				timestamp: Date.now(),
				action: action
			});
			counterData.sign(privateKey)
		}

		this.start();

		this.ripple.reset();
		this.ripple.state = RIPPLE_STATE_STAGE_CONSENSUS;
		
		this.counterData = counterData;
		this.action = bufferToInt(counterData.action)

		this.counterDatas.push(counterData);

		p2p.sendAll(PROTOCOL_CMD_STAGE_INFO_REQUEST, counterData.serialize());
	}
}

module.exports = Counter;