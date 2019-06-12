const CounterData = require("../data/counter");
const { unl } = require("../../config.json");
const utils = require("../../../depends/utils");
const { RIPPLE_STATE_PERISH_NODE, COUNTER_CONSENSUS_STAGE_TRIGGER_MAX_SIZE, PROTOCOL_CMD_COUNTER_FINISH_STATE_REQUEST, PROTOCOL_CMD_COUNTER_FINISH_STATE_RESPONSE, RIPPLE_STATE_STAGE_CONSENSUS, COUNTER_CONSENSUS_STAGE_TRIGGER_THRESHOULD, COUNTER_HANDLER_TIME_DETAY, COUNTER_INVALID_STAGE_TIME_SECTION, STAGE_STATE_EMPTY, RIPPLE_STAGE_AMALGAMATE, RIPPLE_STAGE_CANDIDATE_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE, PROTOCOL_CMD_STAGE_INFO_REQUEST, PROTOCOL_CMD_STAGE_INFO_RESPONSE } = require("../../constant");
const Stage = require("./stage");
const assert = require("assert");

const rlp = utils.rlp;
const sha3 = utils.sha3;
const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerStageConsensus")];
const privateKey = process[Symbol.for("privateKey")];
const mysql = process[Symbol.for("mysql")];

class Counter extends Stage
{
	constructor(ripple)
	{
		super({
			synchronize_state_request_cmd: PROTOCOL_CMD_COUNTER_FINISH_STATE_REQUEST,
			synchronize_state_response_cmd: PROTOCOL_CMD_COUNTER_FINISH_STATE_RESPONSE
		});

		this.ripple = ripple;

		this.stageSynchronizeTrigger = [];
	}

	reset()
	{
		super.reset();

		this.stageSynchronizeTrigger = [];
	}

	handler(ifSuccess)
	{
		if(ifSuccess)
		{
			logger.warn("Counter handler, stage synchronize success")

			this.reset();
			this.ripple.run(this.ifKeepTransactions);
		}
		else
		{
			logger.warn(`Counter handleMessage, stage synchronize success because of timeout, begin to synchronize stage actively, stage: ${this.ripple.stage}`);
			
			this.reset();
			this.startStageSynchronize(true);
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
					logger.warn(`Counter handleMessage, begin to synchronize stage negatively, stage: ${this.ripple.stage}`);

					this.startStageSynchronize(true);
				}
				
				const counterData = new CounterData();
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
						// check timestamp
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

	/**
	 * @param {Boolean} ifKeepTransactions
	 */
	startStageSynchronize(ifKeepTransactions)
	{
		assert(typeof ifKeepTransactions === "boolean", `Counter startStageSynchronize, ifKeepTransactions should be an Boolean, now is ${typeof ifKeepTransactions}`);

		this.ifKeepTransactions = ifKeepTransactions;

		this.start();

		this.ripple.reset();
		this.ripple.state = RIPPLE_STATE_STAGE_CONSENSUS;

		p2p.sendAll(PROTOCOL_CMD_STAGE_INFO_REQUEST);
	}
}

module.exports = Counter;