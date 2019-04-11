const { unl } = require("../../config.json");
const { STAGE_PRIMARY_TIMEOUT, STAGE_FINISH_TIMEOUT, STAGE_MAX_FINISH_TIMES, STATE_EMPTY, STATE_PROCESSING, STATE_SUCCESS_FINISH, STATE_TIMEOUT_FINISH } = require("../../constant");
const process = require("process");
const utils = require("../../../depends/utils");
const assert = require("assert");

const stripHexPrefix = utils.stripHexPrefix;
const rlp = utils.rlp;
const toBuffer = utils.toBuffer;
const bufferToInt = utils.bufferToInt;

const logger = process[Symbol.for("loggerConsensus")];
const p2p = process[Symbol.for("p2p")];

class Stage
{
	constructor(opts)
	{
		this.state = STATE_EMPTY;
		this.timeoutNodes = new Set();

		this.finish_state_request_cmd = opts.finish_state_request_cmd;
		this.finish_state_response_cmd = opts.finish_state_response_cmd;
		
		const self = this;
		this.primary = new Sender(result => {
			self.finish.initFinishTimeout();
			p2p.sendAll(self.finish_state_request_cmd);

			if(result)
			{
				logger.warn("primary stage is over because of timeout");
				self.state = STATE_SUCCESS_FINISH;
			}
			else
			{
				logger.info("primary stage is over success");
				self.state = STATE_TIMEOUT_FINISH;
			}
		}, STAGE_PRIMARY_TIMEOUT);

		let finishTimes = STAGE_MAX_FINISH_TIMES;
		this.finish = new Sender(result => {
			if(!result)
			{
				if(finishTimes > 0)
				{
					logger.warn("finish stage retry");

					self.finish.reset();
					self.finish.initFinishTimeout();
					p2p.sendAll(self.finish_state_request_cmd);

					finishTimes -= 1;
				}
				else
				{
					logger.warn("finish stage is over because of timeout");

					self.handler(false);
					self.reset();
				}
			}
			else
			{
				logger.info("finish stage is over success");

				self.handler(true);
				self.reset();
			}
		}, STAGE_FINISH_TIMEOUT);
	}

	init()
	{
		// init state
		this.state = STATE_PROCESSING;

		this.primary.initFinishTimeout();
	}

	/**
	 * @param {String} address
	 */
	recordFinishNode(address)
	{
		assert(typeof address === "string", `Stage recordFinishNode, address should be a String, now is ${typeof address}`);

		this.primary.recordFinishNode(address);
	}

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage(address, cmd, data)
	{
		assert(Buffer.isBuffer(address), `Stage handleMessage, address should be an Buffer, now is ${typeof address}`);
		assert(typeof cmd === "number", `Stage handleMessage, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(data), `Stage handleMessage, data should be an Buffer, now is ${typeof data}`);

		switch(cmd)
		{
			case this.finish_state_request_cmd:
			{
				const addresses = [];
				for(let i = 0; i < unl.length; i++)
				{
					if(!this.primary.finishAddresses.has(stripHexPrefix(unl[i].address)))
					{
						addresses.push(toBuffer(unl[i].address));
					}

					if(!this.finish.finishAddresses.has(stripHexPrefix(unl[i].address)))
					{
						addresses.push(toBuffer(unl[i].address));
					}
				}
				
				p2p.send(address, this.finish_state_response_cmd, rlp.encode([toBuffer(this.state), addresses]));
			}
			break;
			case this.finish_state_response_cmd:
			{
				const nodeInfo = rlp.decode(data);
				const state = bufferToInt(nodeInfo[0]);
				
				assert(state !== STATE_EMPTY, `Stage handleMessage, address ${address.toString("hex")}, message should not enter an emtpy stage`);

				if(state === STATE_PROCESSING)
				{
					const addressHex = address.toString("hex");
					if(this.timeoutNodes.has(addressHex))
					{
						this.timeoutNodes[addressHex] += 1;
					}
					else
					{
						this.timeoutNodes[addressHex] = 1;
					}
				}
				else if(state === STATE_TIMEOUT_FINISH)
				{
					const addresses = nodeInfo[1];
					addresses.forEach(address => {
						const addressHex = address.toString("hex");
						if(this.timeoutNodes.has(addressHex))
						{
							this.timeoutNodes[addressHex] += 1;
						}
						else
						{
							this.timeoutNodes[addressHex] = 1;
						}
					});

					this.finish.recordFinishNode(address);
				}
				else
				{
					this.finish.recordFinishNode(address);

					logger.warn(`Stage handleMessage, address ${address.toString("hex")}, can success handle all stage`);
				}
			}
		}
	}

	innerReset()
	{
		this.state = STATE_EMPTY;
		this.primary.reset();
		this.finish.reset();
	}

	checkFinishState()
	{
		return this.state === STATE_TIMEOUT_FINISH || this.state === STATE_SUCCESS_FINISH;
	}

	checkProcessingState()
	{
		return this.state === STATE_PROCESSING;
	}
}

class Sender
{
	constructor(handler, expiration)
	{
		this.handler = handler;
		this.expiration = expiration;

		this.finishAddresses = new Set()
		this.timeoutAddresses = new Set();
	}

	/**
	 * @param {String} address
	 */
	recordFinishNode(address)
	{
		assert(typeof address === "string", `Sender recordFinishNode, address should be a String, now is ${typeof address}`);

		if(this.finishAddresses.has(address))
		{
			logger.error(`Sender recordFinishNode, address ${address} send the same consensus request`);
			return;
		}

		this.finishAddresses.add(address);

		// check if all nodes is active
		for(let i = 0; i < unl.length; i++)
		{
			if(!this.finishAddresses.has(stripHexPrefix(unl[i])))
			{
				break;
			}
		}
		if(i === unl.length)
		{
			clearTimeout(this.timeout);
			this.handler(true);
		}
	}

	initFinishTimeout()
	{
		this.timeout = setTimeout(() => {
			// record timeout nodes
			for(let i = 0; i < unl.length; i++)
			{
				if(!this.finishAddresses.has(stripHexPrefix(unl[i])))
				{
					this.timeoutAddresses.add(stripHexPrefix(unl[i]));
				}
			}

			this.handler(false);
		}, this.expiration);
	}

	reset()
	{
		clearTimeout(this.timeout);

		this.finishAddresses = new Set();
		this.timeoutAddresses = new Set();
	}
}

module.exports = Stage;