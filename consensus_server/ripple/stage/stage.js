const { unl } = require("../../config.json");
const { STAGE_STATE_PRIMARY_TIMEOUT, STAGE_STATE_FINISH_TIMEOUT, STAGE_MAX_FINISH_RETRY_TIMES, AVERAGE_TIME_STATISTIC_MAX_TIMES, STAGE_STATE_EMPTY, STAGE_STATE_PROCESSING, STAGE_STATE_SUCCESS_FINISH, STAGE_STATE_TIMEOUT_FINISH } = require("../../constant");
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
		this.state = STAGE_STATE_EMPTY;
		this.timeoutNodes = new Map();

		this.averageTimeStatisticTimes = 0;
		this.averagePrimaryTime = 0;
		this.averageFinishTime = 0;

		this.leftFinishTimes = STAGE_MAX_FINISH_RETRY_TIMES;

		this.finish_state_request_cmd = opts.finish_state_request_cmd;
		this.finish_state_response_cmd = opts.finish_state_response_cmd;
		
		const self = this;
		this.primary = new Sender(result => {
			// compute primary stage consensus time consume
			if(self.averageTimeStatisticTimes === 0)
			{
				self.averagePrimaryTime = self.primary.consensusTimeConsume;
			}
			else
			{
				self.averagePrimaryTime = (self.averagePrimaryTime * self.averageTimeStatisticTimes + self.primary.consensusTimeConsume) / (self.averageTimeStatisticTimes + 1)
			}

			if(result)
			{
				logger.info("primary stage is over success");

				self.state = STAGE_STATE_SUCCESS_FINISH;
				
			}
			else
			{
				logger.warn("primary stage is over because of timeout");

				self.state = STAGE_STATE_TIMEOUT_FINISH;
			}

			self.finish.initFinishTimeout();

			p2p.sendAll(self.finish_state_request_cmd);

		}, STAGE_STATE_PRIMARY_TIMEOUT);

		this.finish = new Sender(result => {
			// compute finish stage consensus time consume
			if(self.averageTimeStatisticTimes === 0)
			{
				self.averageFinishTime = self.primary.consensusTimeConsume;
			}
			else
			{
				self.averageFinishTime = (self.averageFinishTime * self.averageTimeStatisticTimes + self.primary.consensusTimeConsume) / (self.averageTimeStatisticTimes + 1);

				if(self.averageTimeStatisticTimes < AVERAGE_TIME_STATISTIC_MAX_TIMES)
				{
					self.averageTimeStatisticTimes += 1;
				}
			}

			if(result)
			{
				logger.info("finish stage is over success");

				self.handler(true);
				self.reset();
			}
			else
			{
				if(this.leftFinishTimes > 0)
				{
					logger.warn("finish stage retry");

					self.finish.reset();
					self.finish.initFinishTimeout();
					p2p.sendAll(self.finish_state_request_cmd);

					this.leftFinishTimes -= 1;
				}
				else
				{
					logger.warn("finish stage is over because of timeout");

					self.handler(false);
					self.reset();
				}
			}
		}, STAGE_STATE_FINISH_TIMEOUT);
	}

	init()
	{
		// init state
		this.state = STAGE_STATE_PROCESSING;

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

		assert(this.state !== STAGE_STATE_EMPTY, `Stage handleMessage, address ${address.toString("hex")}, message should not enter an emtpy stage`);

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

				if(state === STAGE_STATE_PROCESSING)
				{
					const addressHex = address.toString("hex");
					if(this.timeoutNodes.has(addressHex))
					{
						const count = this.timeoutNodes.get(addressHex);
						this.timeoutNodes.set(addressHex, count + 1);
					}
					else
					{
						this.timeoutNodes.set(addressHex, 1);
					}
				}
				else if(state === STAGE_STATE_TIMEOUT_FINISH)
				{
					const addresses = nodeInfo[1];
					addresses.forEach(address => {
						const addressHex = address.toString("hex");
						if(this.timeoutNodes.has(addressHex))
						{
							const count = this.timeoutNodes.get(addressHex);
							this.timeoutNodes.set(addressHex, count + 1);
						}
						else
						{
							this.timeoutNodes.set(addressHex, 1);
						}
					});

					this.finish.recordFinishNode(address.toString("hex"));

					logger.warn(`Stage handleMessage, address ${address.toString("hex")} consensus timeout`);
				}
				else if(state === STAGE_STATE_SUCCESS_FINISH)
				{
					this.finish.recordFinishNode(address.toString("hex"));

					logger.warn(`Stage handleMessage, address ${address.toString("hex")} have consensus all nondes`);
				}
				else
				{
					logger.error(`Stage handleMessage, address ${address.toString("hex")} is not consensus`);
				}
			}
		}
	}

	innerReset()
	{
		this.state = STAGE_STATE_EMPTY;
		this.leftFinishTimes = STAGE_MAX_FINISH_RETRY_TIMES;

		this.primary.reset();
		this.finish.reset();
	}

	checkFinishState()
	{
		return this.state === STAGE_STATE_TIMEOUT_FINISH || this.state === STAGE_STATE_SUCCESS_FINISH;
	}

	checkProcessingState()
	{
		return this.state === STAGE_STATE_PROCESSING;
	}
}

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
		this.timeoutAddresses = new Set();
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
		let i;
		for(i = 0; i < unl.length; i++)
		{
			if(!this.finishAddresses.has(stripHexPrefix(unl[i])))
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

	initFinishTimeout()
	{
		this.consensusBeginTime = Date.now();

		this.state = SENDER_STATE_PROCESSING;

		this.timeout = setTimeout(() => {
			// record timeout nodes
			for(let i = 0; i < unl.length; i++)
			{
				if(!this.finishAddresses.has(stripHexPrefix(unl[i])))
				{
					this.timeoutAddresses.add(stripHexPrefix(unl[i]));
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

		// this.consensusBeginTime = 0;
		this.consensusTimeConsume = 0;

		this.finishAddresses = new Set();
		this.timeoutAddresses = new Set();
	}
}

module.exports = Stage;