const CounterData = require("../data/counter");
const { unl } = require("../../config.json");
const utils = require("../../../depends/utils");
const process = require("process");
const { PROTOCOL_CMD_COUNTER_FINISH_STATE_REQUEST, PROTOCOL_CMD_COUNTER_FINISH_STATE_RESPONSE, RIPPLE_STATE_STAGE_CONSENSUS, COUNTER_CONSENSUS_STAGE_TRIGGER_THRESHOULD, COUNTER_HANDLER_TIME_DETAY, COUNTER_INVALID_STAGE_TIME_SECTION, STAGE_STATE_EMPTY, RIPPLE_STAGE_AMALGAMATE, RIPPLE_STAGE_CANDIDATE_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE, PROTOCOL_CMD_STAGE_INFO_REQUEST, PROTOCOL_CMD_STAGE_INFO_RESPONSE } = require("../../constant");
const Stage = require("./stage");

const rlp = utils.rlp;
const sha3 = utils.sha3;
const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
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
			logger.fatal("positive stage synchronize success")
		}
		else
		{	
			logger.info("positive stage synchronize failed")
		}

		this.ripple.handleCounter();
		this.ripple.handleCheatedNodes(this.cheatedNodes);
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
				// check if need to synchronize stage
				const now = Date.now();
				this.stageSynchronizeTrigger.push(now);
				if(this.stageSynchronizeTrigger.filter(ele => (ele + COUNTER_INVALID_STAGE_TIME_SECTION) > now).length >= COUNTER_CONSENSUS_STAGE_TRIGGER_THRESHOULD * unl.length)
				{
					// begin to stage synchronize
					if(this.state === STAGE_STATE_EMPTY)
					{
						this.startStageSynchronize();
					}
				}
			}
			break;
			case PROTOCOL_CMD_STAGE_INFO_REQUEST:
			{
				// begin stage synchronize
				if(this.state === STAGE_STATE_EMPTY)
				{
					this.startStageSynchronize();
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
						this.cheatedNodes.push(address);

						logger.info(`Counter handleMessage, address should be ${address.toString("hex")}, now is ${counterData.from.toString("hex")}`);
					}
					else
					{
						// check timestamp
					}
				}
				else
				{
					this.cheatedNodes.push(address);
					
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

	startStageSynchronize()
	{
		logger.warn(`Counter handleMessage, begin to synchronize stage, stage: ${this.ripple.stage}`);

		this.start();

		this.ripple.reset();
		this.ripple.state = RIPPLE_STATE_STAGE_CONSENSUS;

		p2p.sendAll(PROTOCOL_CMD_STAGE_INFO_REQUEST);
	}
}

module.exports = Counter;