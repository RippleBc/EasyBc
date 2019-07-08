const CounterData = require("../data/counter");
const utils = require("../../../depends/utils");
const { RIPPLE_STAGE_AMALGAMATE_FETCHING_NEW_TRANSACTIONS, COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE, COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE, RIPPLE_STATE_PERISH_NODE, COUNTER_CONSENSUS_STAGE_TRIGGER_MAX_SIZE, PROTOCOL_CMD_COUNTER_FINISH_STATE_REQUEST, PROTOCOL_CMD_COUNTER_FINISH_STATE_RESPONSE, RIPPLE_STATE_STAGE_CONSENSUS, COUNTER_CONSENSUS_STAGE_TRIGGER_THRESHOULD, COUNTER_HANDLER_TIME_DETAY, COUNTER_INVALID_STAGE_TIME_SECTION, STAGE_STATE_EMPTY, RIPPLE_STAGE_AMALGAMATE, RIPPLE_STAGE_CANDIDATE_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE, PROTOCOL_CMD_STAGE_INFO_REQUEST, PROTOCOL_CMD_STAGE_INFO_RESPONSE } = require("../../constant");
const Stage = require("./stage");
const assert = require("assert");

const rlp = utils.rlp;
const sha3 = utils.sha3;
const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerStageConsensus")];
const privateKey = process[Symbol.for("privateKey")];
const mysql = process[Symbol.for("mysql")];
const unl = process[Symbol.for("unl")];

class Counter extends Stage
{
	constructor(ripple)
	{
		super({
			synchronize_state_request_cmd: PROTOCOL_CMD_COUNTER_FINISH_STATE_REQUEST,
			synchronize_state_response_cmd: PROTOCOL_CMD_COUNTER_FINISH_STATE_RESPONSE
		});

		this.ripple = ripple;

		this.actions = [];
		this.stageSynchronizeTrigger = [];
	}

	reset()
	{
		super.reset();

		this.actions = [];
		this.stageSynchronizeTrigger = [];
	}

	handler(ifSuccess)
	{
		if(ifSuccess)
		{
			this.reset();

			if(this.action === COUNTER_CONSENSUS_ACTION_FETCH_NEW_TRANSACTIONS_AND_AMALGAMATE)
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
			else if(this.action === COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE)
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
			logger.warn(`Counter handleMessage, stage synchronize success because of timeout, begin to synchronize stage actively, stage: ${this.ripple.stage}`);
			
			this.reset();
			this.startStageSynchronize(this.action);
		}
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
				// begin stage synchronize
				if(this.state === STAGE_STATE_EMPTY && this.ripple.state !== RIPPLE_STATE_PERISH_NODE)
				{
					const action = bufferToInt(data);

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

						this.cheatedNodes.push(address.toString('hex'))

						return;
					}

					this.startStageSynchronize(action);
				}
				
				const counterData = new CounterData();
				counterData.action = this.action;
				counterData.timestamp = Date.now();
				counterData.sign(privateKey);

				p2p.send(address, PROTOCOL_CMD_STAGE_INFO_RESPONSE, counterData.serialize())
			
			}
			break;
			case PROTOCOL_CMD_STAGE_INFO_RESPONSE:
			{
				if(this.state === STAGE_STATE_EMPTY)
				{
					return;
				}

				const counterData = new CounterData(data);

				if(counterData.validate())
				{
					if(address.toString("hex") !== counterData.from.toString("hex"))
					{
						this.cheatedNodes.push(address.toString('hex'));

						logger.info(`Counter handleMessage, address should be ${address.toString("hex")}, now is ${counterData.from.toString("hex")}`);
					}
					else
					{
						if(this.checkIfNodeFinishDataExchange(address.toString("hex")))
						{
							logger.info(`Counter handleMessage, address: ${address.toString("hex")}, send the same exchange data`);
							
							this.cheatedNodes.push(address.toString('hex'));
						}
						else
						{
							const action = bufferToInt(counterData.action);

							this.actions.push(action);
						}
					}
				}
				else
				{
					this.cheatedNodes.push(address.toString('hex'));
					
					logger.info(`Counter handleMessage, address ${address.toString("hex")}, validate failed`);
				}

				this.recordDataExchangeFinishNode(address.toString("hex"));
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
	 */
	startStageSynchronize(action)
	{
		assert(typeof action === "number", `Counter startStageSynchronize, action should be a Number, now is ${typeof action}`);

		this.action = action;

		this.start();

		this.ripple.reset();
		this.ripple.state = RIPPLE_STATE_STAGE_CONSENSUS;

		this.actions.push(action);

		p2p.sendAll(PROTOCOL_CMD_STAGE_INFO_REQUEST, action);
	}
}

module.exports = Counter;