const utils = require("../../depends/utils");
const assert = require("assert");

const logger = process[Symbol.for("loggerConsensus")];
const p2p = process[Symbol.for("p2p")];
const unlManager = process[Symbol.for("unlManager")];

const SENDER_STATE_IDLE = 1;
const SENDER_STATE_PROCESSING = 2;
const SENDER_STATE_FINISH = 3;

class Sender
{
	constructor({handler, expiration, name})
	{
		this.handler = handler;
		this.expiration = expiration;
		this.name = name;

		this.state = SENDER_STATE_IDLE;

		this.finishAddresses = new Set();
	}

	/**
	 * @param {String} address
	 */
	checkIfNodeIsFinished(address)
	{
		assert(typeof address === "string", `${name} Sender checkIfNodeIsFinished, address should be a String, now is ${typeof address}`);

		return this.finishAddresses.has(address);
	}

	/**
	 * @param {String} address
	 */
	recordFinishNode(address)
	{
		assert(typeof address === "string", `${name} Sender recordFinishNode, address should be a String, now is ${typeof address}`);

		if(this.state !== SENDER_STATE_PROCESSING)
		{
			logger.fatal(`${name} Sender recordFinishNode, state should be ${SENDER_STATE_PROCESSING}, now is ${this.state}`);

			process.exit(1);
		}

		// check if repeated recieve
		if(this.finishAddresses.has(address))
		{
			logger.error(`${name} Sender recordFinishNode, repeated receive, address ${address}`);
			
			return false;
		}

		// add address
		this.finishAddresses.add(address);

		// check if arrive address
		if (this.finishAddresses.size >= this.unlManager.threshould)
		{
			this.state = SENDER_STATE_FINISH;

			//
			clearTimeout(this.timeout);

			//
			this.handler();
		}
	}

	start()
	{
		if(this.state !== SENDER_STATE_IDLE)
		{
			logger.fatal(`${name} Sender start, state should be ${SENDER_STATE_IDLE}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`)
			
			process.exit(1);
		}

		this.state = SENDER_STATE_PROCESSING;

		const fullUnl = unlManager.fullUnl;

		this.timeout = setTimeout(() => {

			// send view-change
			

			this.state = SENDER_STATE_FINISH;

		}, this.expiration);
	}

	reset()
	{
		clearTimeout(this.timeout);

		this.state = SENDER_STATE_IDLE;

		this.finishAddresses = new Set();
		this.timeoutNodes = [];
	}
}

module.exports = Sender;