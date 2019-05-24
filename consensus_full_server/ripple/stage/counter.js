const CounterData = require("../data/counter");
const { unl } = require("../../config.json");
const utils = require("../../../depends/utils");
const process = require("process");
const { RIPPLE_MAX_ROUND, RIPPLE_STATE_STAGE_CONSENSUS, COUNTER_CONSENSUS_STAGE_TRIGGER_THRESHOULD, COUNTER_HANDLER_TIME_DETAY, COUNTER_INVALID_STAGE_TIME_SECTION, COUNTER_STATE_IDLE, COUNTER_STATE_PROCESSING, RIPPLE_STAGE_AMALGAMATE, RIPPLE_STAGE_CANDIDATE_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE, PROTOCOL_CMD_STAGE_INFO_REQUEST, PROTOCOL_CMD_STAGE_INFO_RESPONSE } = require("../../constant");
const Stage = require("./stage");

const rlp = utils.rlp;
const sha3 = utils.sha3;
const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = processSymbol[.for("privateKey")];
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
		this.state = COUNTER_STATE_IDLE;

		this.stageSynchronizeTrigger = [];
		this.cheatedNodes = [];
	}

	reset()
	{
		super.reset();

		this.state = COUNTER_STATE_IDLE;
		this.stageSynchronizeTrigger = [];
	}

	handler(ifSuccess)
	{
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
					if(this.state === COUNTER_STATE_IDLE)
					{
						this.startStageSynchronize();
					}
				}
			}
			break;
			case PROTOCOL_CMD_STAGE_INFO_REQUEST:
			{
				// begin stage synchronize
				if(this.state === COUNTER_STATE_IDLE)
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
				if(this.state === COUNTER_STATE_IDLE)
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
				super.handleMessage(address, cmd, data);
			}
		}
	}

	startStageSynchronize()
	{
		logger.info(`Counter handleMessage, begin to synchronize stage, current own round: ${this.ripple.round}, stage: ${this.ripple.stage}`);

		this.start();

		this.ripple.reset();
		this.ripple.state = RIPPLE_STATE_STAGE_CONSENSUS;

		this.state = COUNTER_STATE_PROCESSING;

		p2p.sendAll(PROTOCOL_CMD_STAGE_INFO_REQUEST);
	}
}

module.exports = Counter;