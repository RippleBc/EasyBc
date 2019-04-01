const { unl } = require("../../config.json");
const { STAGE_PRIMARY_TIMEOUT, STAGE_FINISH_TIMEOUT, STAGE_MAX_FINISH_TIMES } = require("../../constant");
const process = require("process");
const utils = require("../../../depends/utils");

const stripHexPrefix = utils.stripHexPrefix;
const rlp = utils.rlp;
const toBuffer = utils.toBuffer;
const bufferToInt = utils.bufferToInt;

const logger = process[Symbol.for("loggerConsensus")];
const p2p = process[Symbol.for("p2p")];

const STATE_EMPTY = 0;
const STATE_SUCCESS_FINISH = 1;
const STATE_TIMEOUT_FINISH = 2;

class Stage
{
	constructor(opts)
	{
		this.state = STATE_EMPTY;
		this.timeoutNodes = new Set();

		this.handler = opts.handler;
		this.finish_state_request_cmd = opts.finish_state_request_cmd;
		this.finish_state_response_cmd = opts.finish_state_response_cmd;
		
		const self = this;
		this.primary = new Sender(result => {
			self.finish.initFinishTimeout();
			p2p.sendAll(self.finish_state_request_cmd);

			if(result)
			{
				self.state = STATE_SUCCESS_FINISH;
			}
			else
			{
				self.state = STATE_TIMEOUT_FINISH;
			}
		}, PRIMARY_TIMEOUT);

		let finishTimes = STAGE_MAX_FINISH_TIMES;
		this.finish = new Sender(result => {
			if(!result && finishTimes > 0)
			{
				self.finish.initFinishTimeout();
				p2p.sendAll(self.finish_state_request_cmd);
				finishTimes -= 1;
			}
			else
			{
				self.handler();
			}
		}, FINISH_TIMEOUT);
	}

	initFinishTimeout()
	{
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
					if(!this.primary.finishAddresses.has(stripHexPrefix(unl.[i])))
					{
						addresses.push(toBuffer(unl.[i]));
					}

					if(!this.finish.finishAddresses.has(stripHexPrefix(unl.[i])))
					{
						addresses.push(toBuffer(unl.[i]));
					}
				}
				
				p2p.send(address, this.finish_state_response_cmd, rlp.encode([toBuffer(this.state), addresses]));
			}
			break;
			case this.finish_state_response_cmd:
			{
				const nodeInfo = rlp.decode(data);
				const state = bufferToInt(nodeInfo[0]);
				if(state === STATE_EMPTY)
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
				}
				else
				{
					
				}

				this.finish.recordFinishNode(address);
			}
		}
	}

	reset()
	{
		this.state = STATE_EMPTY;
		this.primary.reset();
		this.finish.reset();
	}
}

class Sender
{
	constructor(handler, expiration)
	{
		this.handler = handler;
		this.expiration = expiration;

		this.finishAddresses = []
		this.timeoutAddresses = [];
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
					this.timeoutAddresses.push(stripHexPrefix(unl[i]));
				}
			}

			this.handler(false);
		}, this.expiration);
	}

	reset()
	{
		this.finishAddresses = []
		this.timeoutAddresses = [];
	}
}

module.exports = Stage;