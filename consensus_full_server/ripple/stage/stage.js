const { CHEAT_REASON_INVALID_ADDRESS, CHEAT_REASON_INVALID_SIG, CHEAT_REASON_REPEAT_DATA_EXCHANGE, STAGE_STATE_EXPIRATION, STAGE_STATE_EMPTY, STAGE_STATE_PROCESSING, STAGE_STATE_FINISH } = require("../../constant");
const assert = require("assert");
const Sender = require("../sender");
const Base = require("../data/base");

const logger = process[Symbol.for("loggerConsensus")];
const unlManager = process[Symbol.for("unlManager")];

class Stage
{
	constructor({name})
	{
		super();

		this.state = STAGE_STATE_EMPTY;

		// cheated nodes
		this.cheatedNodes = [];

		// 
		this.name = name;

		this.dataExchange = new Sender({handler: () => {
		
			logger.info(`${this.name} Stage dataExchange, stage: ${this.ripple.stage}, dataExchange is over success`);

			this.state = STAGE_STATE_FINISH;

			this.handler();

		}, expiration: STAGE_STATE_EXPIRATION, name: name});
	}

	start()
	{
		if (this.state !== STAGE_STATE_EMPTY) {
			logger.fatal(`${this.name} Stage start, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

			process.exit(1);
		}

		//
		this.state = STAGE_STATE_PROCESSING;

		// 
		if (unlManager.fullUnl.length > 0)
		{
			this.dataExchange.start();

			return;
		}

		// adapted to single mode
		this.state = STAGE_STATE_FINISH;

		this.handler();
	}

	/**
	 * @param {Base} candidate
	 * @param {Array} candidates
	 * @param {String} address
	 */
	validateAndProcessExchangeData(candidate, candidates, address)
	{
		assert(candidate instanceof Base, `${this.name} Stage, candidate should be an instance of Base, now is ${typeof candidate}`);
		assert(Array.isArray(candidates), `${this.name} Stage, candidates should be an Array, now is ${typeof candidates}`);
		assert(typeof address === 'string', `${this.name} Stage, address should be a String, now is ${typeof address}`);

		// check if receive repeated exchange data
		if(!this.dataExchange.recordFinishNode(address))
		{
			logger.error(`${this.name} Stage validate, address: ${address}, send the same exchange data`);
			
			this.cheatedNodes.push({
				address: address,
				reason: CHEAT_REASON_REPEAT_DATA_EXCHANGE
			});

			return;
		}

		// check sig
		if(!candidate.validate())
		{
			logger.error(`${this.name} Stage validate, address: ${address}, validate failed`);

			this.cheatedNodes.push({
				address: toString('hex'),
				reason: CHEAT_REASON_INVALID_SIG
			});

			return;
		}

		// check address
		if(address !== candidate.from.toString("hex"))
		{
			logger.error(`${this.name} Stage validate, address should be ${address}, now is ${candidate.from.toString("hex")}`);

			this.cheatedNodes.push({
				address: address.toString('hex'),
				reason: CHEAT_REASON_INVALID_ADDRESS
			});
			
			return;
		}

		candidates.push(candidate);
	}

	reset()
	{
		this.cheatedNodes = [];

		this.state = STAGE_STATE_EMPTY;

		this.dataExchange.reset();
	}
}

module.exports = Stage;