const { unl } = require("../../config.json");
const { STAGE_STATE_PRIMARY_TIMEOUT, STAGE_STATE_FINISH_TIMEOUT, STAGE_MAX_FINISH_RETRY_TIMES, AVERAGE_TIME_STATISTIC_MAX_TIMES, STAGE_STATE_EMPTY, STAGE_STATE_PROCESSING, STAGE_STATE_SUCCESS_FINISH, STAGE_STATE_TIMEOUT_FINISH } = require("../../constant");
const process = require("process");
const utils = require("../../../depends/utils");
const assert = require("assert");
const Sender = require("../sender");

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

		// timeout nodes
		this.friendNodesTimeoutNodes = [];
		this.ownTimeoutNodes = [];

		// cheated nodes
		this.cheatedNodes = [];

		// stage consensus time consume
		this.averageTimeStatisticTimes = 0;
		this.averagePrimaryTime = 0;
		this.averageFinishTime = 0;

		//
		this.totalFinishTime = 0;
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
				logger.trace("Stage, primary stage is over success");

				self.state = STAGE_STATE_SUCCESS_FINISH;
				
			}
			else
			{
				// record the timeout node
				for(let i = 0; i < unl.length; i++)
				{
					if(!this.primary.finishAddresses.has(stripHexPrefix(unl[i].address)))
					{
						this.ownTimeoutNodes.push(unl[i].address);
					}
				}

				//
				logger.trace("Stage, primary stage is over because of timeout");

				self.state = STAGE_STATE_TIMEOUT_FINISH;
			}

			self.finish.initFinishTimeout();

			p2p.sendAll(self.finish_state_request_cmd);

		}, STAGE_STATE_PRIMARY_TIMEOUT);

		this.finish = new Sender(result => {
			self.totalFinishTime += self.finish.consensusTimeConsume;

			if(result)
			{
				logger.trace("Stage, finish stage is over success");

				// compute finish stage consensus time consume
				if(self.averageTimeStatisticTimes === 0)
				{
					self.averageFinishTime = self.totalFinishTime;
				}
				else
				{
					self.averageFinishTime = (self.averageFinishTime * self.averageTimeStatisticTimes + self.totalFinishTime) / (self.averageTimeStatisticTimes + 1);
				}
				//
				if(self.averageTimeStatisticTimes < AVERAGE_TIME_STATISTIC_MAX_TIMES)
				{
					self.averageTimeStatisticTimes += 1;
				}

				//
				self.handler(true);
				self.ripple.handleTimeoutNodes(this.ownTimeoutNodes, this.friendNodesTimeoutNodes);
				self.reset();
			}
			else
			{
				// record the timeout node
				for(let i = 0; i < unl.length; i++)
				{
					if(!this.finish.finishAddresses.has(stripHexPrefix(unl[i].address)))
					{
						this.ownTimeoutNodes.push(unl[i].address);
					}
				}

				if(this.leftFinishTimes > 0)
				{
					logger.trace("Stage, finish stage retry");

					self.finish.reset();
					self.finish.initFinishTimeout();
					p2p.sendAll(self.finish_state_request_cmd);

					this.leftFinishTimes -= 1;
				}
				else
				{
					logger.trace("Stage, finish stage is over because of timeout");

					// compute finish stage consensus time consume
					if(self.averageTimeStatisticTimes === 0)
					{
						self.averageFinishTime = self.totalFinishTime;
					}
					else
					{
						self.averageFinishTime = (self.averageFinishTime * self.averageTimeStatisticTimes + self.totalFinishTime) / (self.averageTimeStatisticTimes + 1);
					}
					if(self.averageTimeStatisticTimes < AVERAGE_TIME_STATISTIC_MAX_TIMES)
					{
						self.averageTimeStatisticTimes += 1;
					}

					//
					self.handler(false);
					self.ripple.handleTimeoutNodes(this.ownTimeoutNodes, this.friendNodesTimeoutNodes);
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
				let timeoutAddresses = [];
				if(this.state === STAGE_STATE_TIMEOUT_FINISH || this.state === STAGE_STATE_SUCCESS_FINISH)
				{
					for(let i = 0; i < unl.length; i++)
					{
						if(!this.primary.finishAddresses.has(stripHexPrefix(unl[i].address)))
						{
							timeoutAddresses.push(unl[i].address);
						}

						if(!this.finish.finishAddresses.has(stripHexPrefix(unl[i].address)))
						{
							timeoutAddresses.push(unl[i].address);
						}
					}
					
					// filter the same timeoutAddresses
					timeoutAddresses = [...new Set(timeoutAddresses)];
				}
				
				//
				p2p.send(address, this.finish_state_response_cmd, rlp.encode([toBuffer(this.state), timeoutAddresses]));
			}
			break;
			case this.finish_state_response_cmd:
			{
				const nodeInfo = rlp.decode(data);
				const state = bufferToInt(nodeInfo[0]);
				const timeoutAddresses = [...new Set(nodeInfo[1])];

				if(state === STAGE_STATE_PROCESSING)
				{
					const addressHex = address.toString("hex");

					this.friendNodesTimeoutNodes.push(addressHex)
				}
				else if(state === STAGE_STATE_TIMEOUT_FINISH)
				{
					timeoutAddresses.forEach(address => {
						const addressHex = address.toString("hex");
						
						this.friendNodesTimeoutNodes.push(addressHex);
					});

					this.finish.recordFinishNode(address.toString("hex"));

					logger.trace(`Stage handleMessage, address: ${address.toString("hex")}, consensus is over because of timeout`);
				}
				else if(state === STAGE_STATE_SUCCESS_FINISH)
				{
					this.finish.recordFinishNode(address.toString("hex"));

					logger.trace(`Stage handleMessage, address: ${address.toString("hex")}, consensus is over success`);
				}
				else
				{
					logger.error(`Stage handleMessage, address: ${address.toString("hex")}, consensus is proceeding`);
				}
			}
		}
	}

	innerReset()
	{
		this.ownTimeoutNodes = [];
		this.friendNodesTimeoutNodes = [];

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

module.exports = Stage;