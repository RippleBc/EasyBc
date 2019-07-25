const CounterData = require("../data/counter");
const utils = require("../../../depends/utils");
const { STAGE_SYNCHRONIZE_EMPTY_MODE, STAGE_SYNCHRONIZE_SPREAD_MODE, STAGE_SYNCHRONIZE_FETCH_MODE, RIPPLE_STAGE_PERISH_PROCESSING_CHEATED_NODES, PROTOCOL_CMD_COUNTER_STAGE_SYNC_REQUEST, PROTOCOL_CMD_COUNTER_STAGE_SYNC_RESPONSE, CHEAT_REASON_MALICIOUS_COUNTER_ACTION, COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_STAGE_FALL_BEHIND, COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_TRANSACTION_CONSENSUS_FAILED, TIMEOUT_REASON_SLOW, CHEAT_REASON_INVALID_SIG, TRANSACTIONS_CONSENSUS_THRESHOULD, CHEAT_REASON_COUNTER_DATA_INVALID_TIMESTAMP, CHEAT_REASON_REPEATED_COUNTER_DATA, CHEAT_REASON_INVALID_COUNTER_ACTION, RIPPLE_STAGE_COUNTER_FETCHING_NEW_TRANSACTIONS, COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE, RIPPLE_STAGE_PERISH, COUNTER_CONSENSUS_STAGE_TRIGGER_MAX_SIZE, PROTOCOL_CMD_COUNTER_FINISH_STATE_REQUEST, PROTOCOL_CMD_COUNTER_FINISH_STATE_RESPONSE, RIPPLE_STAGE_COUNTER, COUNTER_CONSENSUS_STAGE_TRIGGER_THRESHOULD, COUNTER_INVALID_STAGE_TIME_SECTION, STAGE_STATE_EMPTY, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE, PROTOCOL_CMD_COUNTER_INFO_REQUEST, PROTOCOL_CMD_COUNTER_INFO_RESPONSE } = require("../../constant");
const Stage = require("./stage");
const assert = require("assert");
const _ = require("underscore");

const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerStageConsensus")];
const privateKey = process[Symbol.for("privateKey")];
const unlManager = process[Symbol.for("unlManager")];

const COUNTER_DATA_TIMESTAMP_CHEATED_LEFT_GAP = 10 * 1000;
const COUNTER_DATA_TIMESTAMP_CHEATED_RIGHT_GAP = 10 * 1000;

const COUNTER_DATA_TIMESTAMP_STOP_SPREAD_LEFT_GAP = 5 * 1000;
const COUNTER_DATA_TIMESTAMP_STOP_SPREAD_RIGHT_GAP = 5 * 1000;

const COUNTERS_MAP_CLEAR_INTERVAL = 12 * 1000;

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

		this.syncMode = STAGE_SYNCHRONIZE_EMPTY_MODE;

		this.countersMap = new Map();
		this.countersMapClearInterval = setInterval(() => {
			const now = Date.now();
			
			// filter expire couner data
			this.countersMap = new Map(
				[...this.countersMap].filter(([, v]) => v > now - COUNTERS_MAP_CLEAR_INTERVAL)
			);
		}, COUNTERS_MAP_CLEAR_INTERVAL);
		this.countersMapClearInterval.unref();
	}

	reset()
	{
		super.reset();

		this.counterDatas = [];
		this.stageSynchronizeTrigger = [];

		this.syncMode = STAGE_SYNCHRONIZE_EMPTY_MODE;
	}

	handler({ ifSuccess = true, ifCheckState = true } = { ifSuccess: true, ifCheckState: true })
	{
		if(ifCheckState && !this.checkIfDataExchangeIsFinish())
		{
			logger.fatal(`Counter handler, counter data exchange should finish, current state is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);
			
			process.exit(1)
		}

		if(ifSuccess)
		{
			logger.info("Counter handler, sync stage success")
		}
		else
		{	
			logger.info("Counter handler, sync stage success because of timeout")
		}

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

		const fullUnl = unlManager.fullUnl;

		//
		if(sortedActionColls[0] && sortedActionColls[0][1] / (fullUnl.length + 1) >= TRANSACTIONS_CONSENSUS_THRESHOULD)
		{
			this.reset();
			
			const action = sortedActionColls[0][0];

			if(action === COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE)
			{
				logger.info("Counter handler, stage synchronize success, begin to fetch new transaction and amalgamate")

				this.ripple.stage = RIPPLE_STAGE_COUNTER_FETCHING_NEW_TRANSACTIONS;

				(async () => {
					// fetch new transactions
					const {
						transactions: newTransactions,
						deleteTransactions
					} = await this.ripple.getNewTransactions();

					// check if stage is invalid
					if(this.ripple.stage === RIPPLE_STAGE_PERISH 
						|| this.ripple.stage === RIPPLE_STAGE_PERISH_PROCESSING_CHEATED_NODES)
						{
							return this.ripple.amalgamateMessagesCacheCounter = [];
						}

					this.ripple.run({
						fetchingNewTransaction: true,
						transactions: newTransactions
					});

					// handle cached messages
					for(let i = 0; i < this.ripple.amalgamateMessagesCacheCounter.length; i++)
					{
						let {address, cmd, data} = this.ripple.amalgamateMessagesCacheCounter[i];
						this.ripple.amalgamate.handleMessage(address, cmd, data);
					}

					this.ripple.amalgamateMessagesCacheCounter = [];
					
					// delete transactions from db
					await deleteTransactions()

				})().catch(e => {
					logger.fatal(`Counter handler, throw exception, ${process[Symbol.for("getStackInfo")](e)}`);

					process.exit(1);
				});
			}
			else if(action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_TRANSACTION_CONSENSUS_FAILED)
			{
				logger.info("Counter handler, stage synchronize success, begin to reuse cached transactions and amalgamate because of transaction consensus failed")

				this.ripple.run();
			}
			else if(action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_STAGE_FALL_BEHIND)
			{
				logger.info("Counter handler, stage synchronize success, begin to reuse cached transactions and amalgamate because of stage fall behind")

				this.ripple.run();
			}
			else
			{
				logger.fatal(`Counter handler, invalid action, ${this.action}`);

				process.exit(1);
			}
		}
		else 
		{
			// sync stage debug info
			let counterDataInfo = ""
			for(let counterData of this.counterDatas)
			{
				counterDataInfo += `address: ${counterData.from.toString("hex")}, action: ${bufferToInt(counterData.action)}, `
			}
			counterDataInfo = counterDataInfo.slice(0, -1);
			logger.error(`Counter handler, stage sync failed, ${counterDataInfo}`);

			this.reset();
			this.ripple.run();
		}
	}

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage(address, cmd, data)
	{
		const unl = unlManager.unl;

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
			case PROTOCOL_CMD_COUNTER_INFO_REQUEST:
			{
				if(this.state === STAGE_STATE_EMPTY)
				{
					return;
				}
				
				p2p.send(address, PROTOCOL_CMD_COUNTER_INFO_RESPONSE, this.counterData)
			}
			break;
			case PROTOCOL_CMD_COUNTER_INFO_RESPONSE:
			{
				if(this.state === STAGE_STATE_EMPTY)
				{
					return;
				}

				if (this.syncMode !== STAGE_SYNCHRONIZE_FETCH_MODE) {
					return;
				}

				const counterData = new CounterData(data);

				this.validateAndProcessExchangeData(counterData, this.counterDatas, address.toString("hex"), {
					addressCheck: false
				});
			}
			break;
			case PROTOCOL_CMD_COUNTER_STAGE_SYNC_REQUEST:
			{
				// there is node begin to sync stage, check if already in sync stage
				if(this.state === STAGE_STATE_EMPTY)
				{
					// check if counter data sig and address is valid
					const counterData = new CounterData(data);
					if(!counterData.validate())
					{
						logger.error(`Counter handleMessage, address: ${address.toString('hex')}, validate failed`);

						return this.cheatedNodes.push({
							address: address.toString('hex'),
							reason: CHEAT_REASON_INVALID_SIG
						});
					}

					// check timestamp
					const now = Date.now();
					const timestamp = bufferToInt(counterData.timestamp)
					if(timestamp > now + COUNTER_DATA_TIMESTAMP_CHEATED_RIGHT_GAP || timestamp < now - COUNTER_DATA_TIMESTAMP_CHEATED_LEFT_GAP)
					{
						logger.error(`Counter handleMessage, address: ${address.toString('hex')}, invalid timestamp ${timestamp}, now is ${now}`);

						return this.cheatedNodes.push({
							address: address.toString('hex'),
							reason: CHEAT_REASON_COUNTER_DATA_INVALID_TIMESTAMP
						})
					}

					// 
					const counterDataHash = counterData.hash().toString("hex");
						
					// check if counter is repeated
					if (this.countersMap.has(counterDataHash))
					{
						logger.error(`Counter handleMessage, counter data is repeated, address: ${address.toString('hex')}`)

						return this.cheatedNodes.push({
							address: address.toString('hex'),
							reason: CHEAT_REASON_REPEATED_COUNTER_DATA
						})
					}
					
					// record counter 
					this.countersMap.set(counterDataHash, timestamp);

					const action = bufferToInt(counterData.action);
					if(action === COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE)
					{
						logger.info(`Counter handleMessage, begin to synchronize stage negatively, stage: ${this.ripple.stage}, begin to fetch new transactions and amalgamate`);
					}
					else if(action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_TRANSACTION_CONSENSUS_FAILED)
					{
						logger.info(`Counter handleMessage, begin to synchronize stage negatively, stage: ${this.ripple.stage}, begin to use cached tranasctions and amalgamate because of transaction consensus failed`);
					}
					else if(action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_STAGE_FALL_BEHIND)
					{
						logger.info(`Counter handleMessage, begin to synchronize stage negatively, stage: ${this.ripple.stage}, begin to use cached tranasctions and amalgamate because of stage fall behind`);
					}
					else
					{
						logger.error(`Counter handleMessage, invalid action, ${action}`)

						return this.cheatedNodes.push({
							address: address.toString('hex'),
							reason: CHEAT_REASON_INVALID_COUNTER_ACTION
						})
					}

					// handle cheated nodes
					if(action === COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE 
						|| action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_TRANSACTION_CONSENSUS_FAILED)
					{
						// then amalgamate is processing, or block agreement is processing, or candidate agreement data exchange is processing
						if(this.ripple.candidateAgreement.checkDataExchangeIsProceeding() 
						|| this.ripple.amalgamate.checkIfDataExchangeIsFinish()
						|| this.ripple.amalgamate.checkDataExchangeIsProceeding() 
						|| this.ripple.blockAgreement.checkIfDataExchangeIsFinish() 
						|| this.ripple.blockAgreement.checkDataExchangeIsProceeding() )
						{
							logger.error(`Counter handleMessage, address: ${address.toString('hex')}, want to fetching new transctions or reuse cached transactions, but own stage is ${this.ripple.stage}`)

							return this.cheatedNodes.push({
								address: counterData.from.toString('hex'),
								reason: CHEAT_REASON_MALICIOUS_COUNTER_ACTION
							})
						}
					}

					// record fall behind node
					if(action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_STAGE_FALL_BEHIND)
					{
						this.ripple.handleTimeoutNodes([{
							address: counterData.from.toString('hex'),
							reason: TIMEOUT_REASON_SLOW
						}]);
					}

					// check if spread counter data
					if(timestamp < now + COUNTER_DATA_TIMESTAMP_STOP_SPREAD_RIGHT_GAP && timestamp > now - COUNTER_DATA_TIMESTAMP_STOP_SPREAD_LEFT_GAP)
					{
						this.startStageSynchronizeSpreadMode({
							counterData: counterData
						});
					}
					else
					{
						this.startStageSynchronizeFetchMode({
							counterData: counterData
						})
					}
			
					p2p.send(address, PROTOCOL_CMD_COUNTER_STAGE_SYNC_RESPONSE, this.counterData.serialize());
				}
				else
				{
					p2p.send(address, PROTOCOL_CMD_COUNTER_STAGE_SYNC_RESPONSE, this.counterData.serialize());
				}
			}
			break;
			case PROTOCOL_CMD_COUNTER_STAGE_SYNC_RESPONSE:
			{
				if(this.state === STAGE_STATE_EMPTY)
				{
					return;
				}

				if (this.syncMode !== STAGE_SYNCHRONIZE_SPREAD_MODE) {
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
		const unl = unlManager.unl;

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

	/**
	 * @param {Number} action
	 * @param {CounterData} counterData
	 */
	startStageSynchronizeSpreadMode({action, counterData})
	{
		if(this.state !== STAGE_STATE_EMPTY)
		{
			logger.fatal(`Counter startStageSynchronizeSpreadMode, counter state should be STAGE_STATE_EMPTY, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

			process.exit(1)
		}

		if(this.ripple.stage === RIPPLE_STAGE_COUNTER_FETCHING_NEW_TRANSACTIONS)
		{
			logger.error(`Counter startStageSynchronizeSpreadMode, ripple stage is RIPPLE_STAGE_COUNTER_FETCHING_NEW_TRANSACTIONS, do not process counter sync request`);

			return;
		}

		if(action === undefined && counterData === undefined)
		{
			throw new Error(`Counter startStageSynchronizeSpreadMode, action and counterData can not be undefined at the same time`);
		}
		
		if(counterData)
		{
			assert(counterData instanceof CounterData, `Counter startStageSynchronizeSpreadMode, counterData should be an instance of CounterData, now is ${typeof counterData}`);
		}
		else
		{
			assert(typeof action === "number", `Counter startStageSynchronizeSpreadMode, action should be a Number, now is ${typeof action}`);
		
			counterData = new CounterData({
				timestamp: Date.now(),
				action: action
			});
			counterData.sign(privateKey)
		}

		this.start();

		this.ripple.reset();
		this.ripple.stage = RIPPLE_STAGE_COUNTER;
		
		this.counterData = counterData;
		this.action = bufferToInt(counterData.action)
		this.counterDatas.push(counterData);

		this.syncMode = STAGE_SYNCHRONIZE_SPREAD_MODE;

		logger.info(`Counter startStageSynchronizeSpreadMode, begin to send stage sync protocol, stage: ${this.ripple.stage}`);

		p2p.sendAll(PROTOCOL_CMD_COUNTER_STAGE_SYNC_REQUEST, counterData.serialize());
	}

	/**
	 * @param {CounterData} counterData
	 */
	startStageSynchronizeFetchMode({counterData})
	{
		if(this.state !== STAGE_STATE_EMPTY)
		{
			logger.fatal(`Counter startStageSynchronizeFetchMode, counter state should be STAGE_STATE_EMPTY, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

			process.exit(1);
		}

		if(this.ripple.stage === RIPPLE_STAGE_COUNTER_FETCHING_NEW_TRANSACTIONS)
		{
			logger.error(`Counter startStageSynchronizeFetchMode, ripple stage is RIPPLE_STAGE_COUNTER_FETCHING_NEW_TRANSACTIONS, do not process counter sync request`);

			return;
		}

		assert(counterData instanceof CounterData, `Counter startStageSynchronizeFetchMode, counterData should be an instance of CounterData, now is ${typeof counterData}`);
	
		this.start();

		this.ripple.reset();
		this.ripple.stage = RIPPLE_STAGE_COUNTER;
		
		this.counterData = counterData;
		this.action = bufferToInt(counterData.action);
		this.counterDatas.push(counterData);

		this.syncMode = STAGE_SYNCHRONIZE_FETCH_MODE;

		logger.info(`Counter startStageSynchronizeFetchMode, begin to send info protocol, stage: ${this.ripple.stage}`);

		p2p.sendAll(PROTOCOL_CMD_COUNTER_INFO_REQUEST);
	}
}

module.exports = Counter;