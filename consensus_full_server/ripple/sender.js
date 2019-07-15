const utils = require("../../depends/utils");
const assert = require("assert");
const { TIMEOUT_REASON_OFFLINE, TIMEOUT_REASON_DEFER } = require("../constant")

const stripHexPrefix = utils.stripHexPrefix;

const logger = process[Symbol.for("loggerConsensus")];
const p2p = process[Symbol.for("p2p")];
const unlManager = process[Symbol.for("unlManager")];

const SENDER_STATE_IDLE = 1;
const SENDER_STATE_PROCESSING = 2;
const SENDER_STATE_FINISH = 3;

class Sender
{
	constructor(handler, expiration)
	{
		this.handler = handler;
		this.expiration = expiration;

		this.consensusBeginTime = 0;
		this.consensusTimeConsume = 0;

		this.state = SENDER_STATE_IDLE;

		this.finishAddresses = new Set()
		this.timeoutNodes = [];
	}

	/**
	 * @param {String} address
	 */
	checkIfNodeIsFinished(address)
	{
		assert(typeof address === "string", `Sender checkIfNodeIsFinished, address should be a String, now is ${typeof address}`);

		return this.finishAddresses.has(address);
	}

	/**
	 * @param {String} address
	 */
	recordFinishNode(address)
	{
		assert(typeof address === "string", `Sender recordFinishNode, address should be a String, now is ${typeof address}`);

		if(this.state !== SENDER_STATE_PROCESSING)
		{
			return;
		}
		if(this.finishAddresses.has(address))
		{
			logger.error(`Sender recordFinishNode, address ${address} send the same consensus request`);
			return;
		}
		this.finishAddresses.add(address);

		// check if all nodes is active
		const unl = unlManager.unl;
		let i;
		for(i = 0; i < unl.length; i++)
		{
			if(!this.finishAddresses.has(stripHexPrefix(unl[i].address)))
			{
				break;
			}
		}

		if(i === unl.length)
		{
			this.consensusTimeConsume = Date.now() - this.consensusBeginTime;
			this.state = SENDER_STATE_FINISH;

			clearTimeout(this.timeout);
			this.handler(true);
		}
	}

	start()
	{
		if(this.state !== SENDER_STATE_IDLE)
		{
			logger.fatal(`Sender start, before start please call reset, ${process[Symbol.for("getStackInfo")]()}`)
			
			process.exit(1)
		}

		this.consensusBeginTime = Date.now();

		this.state = SENDER_STATE_PROCESSING;

		const fullUnl = unlManager.fullUnl;

		this.timeout = setTimeout(() => {

			// record timeout nodes
			for(let i = 0; i < fullUnl.length; i++)
			{
				if(!this.finishAddresses.has(fullUnl[i].address))
				{
					if(p2p.checkIfConnectionIsOpen(Buffer.from(fullUnl[i].address, "hex")))
					{
						this.timeoutNodes.push({
							address: fullUnl[i].address,
							reason: TIMEOUT_REASON_DEFER
						});
					}
					else
					{
						this.timeoutNodes.push({
							address: fullUnl[i].address,
							reason: TIMEOUT_REASON_OFFLINE
						});
					}
				}
			}

			this.consensusTimeConsume = Date.now() - this.consensusBeginTime;
			this.state = SENDER_STATE_FINISH;

			this.handler(false);
		}, this.expiration);
	}

	reset()
	{
		clearTimeout(this.timeout);

		this.state = SENDER_STATE_IDLE;

		this.consensusBeginTime = 0;
		this.consensusTimeConsume = 0;

		this.finishAddresses = new Set();
		this.timeoutNodes = [];
	}
}

module.exports = Sender;