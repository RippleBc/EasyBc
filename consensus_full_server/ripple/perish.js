const PerishData = require("./data/perish");
const { unl } = require("../config.json");
const utils = require("../../depends/utils");
const process = require("process");
const AsyncEventemitter = require("async-eventemitter");
const Sender = require("./sender");
const { PERISH_VALID_THRESHOULD, PERISH_CHEATED_THRESHOULD, PERISH_MAX_FINISH_RETRY_TIMES, PERISH_FINISH_TIMEOUT, PERISH_DATA_STATE_NOT_KILLED, PERISH_DATA_STATE_KILLING, PERISH_DATA_STATE_KILLED, PROTOCOL_CMD_KILL_NODE_REQUEST, PROTOCOL_CMD_KILL_NODE_STATUS_REQUEST, PROTOCOL_CMD_KILL_NODE_STATUS_RESPONSE, PERISH_STATUS_IDLE, PERISH_STATUS_PROCESSING, PERISH_STATUS_FINISH } = require("../constant");

const rlp = utils.rlp;
const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class Perish extends AsyncEventemitter
{
	constructor(ripple)
	{
		super();

		this.ripple = ripple;

		this.state = PERISH_STATUS_IDLE;

		this.perishData = undefined;

		this.cheatedNodes = [];

		this.leftFinishTimes = PERISH_MAX_FINISH_RETRY_TIMES;
		this.finish = new Sender(result => {

			if(result)
			{
				logger.trace("Perish, finish stage is over success");

				//
				self.handler(true);
				self.reset();
			}
			else
			{
				if(this.leftFinishTimes > 0)
				{
					logger.trace("Perish, finish stage retry");

					self.finish.reset();
					self.finish.initFinishTimeout();
					p2p.sendAll(PROTOCOL_CMD_KILL_NODE_STATUS_REQUEST);

					this.leftFinishTimes -= 1;
				}
				else
				{
					logger.trace("Perish, finish stage is over because of timeout");

					//
					self.handler(false);
					self.reset();
				}
			}
		}, PERISH_FINISH_TIMEOUT);
	}

	reset()
	{
		this.state = PERISH_STATUS_IDLE;

		this.perishData = undefined;

		this.cheatedNodes = [];

		this.leftFinishTimes = PERISH_MAX_FINISH_RETRY_TIMES;
		this.finish.reset();
	}

	handler()
	{
		this.state = PERISH_STATUS_FINISH;

		//
		if(this.finish.finishAddresses.size() / unl.length > PERISH_VALID_THRESHOULD)
		{
			this.ripple.recordKilledNode(this.perishData.address);
		}
		else if(this.finish.finishAddresses.size() / unl.length > PERISH_CHEATED_THRESHOULD)
		{
			this.cheatedNodes.push(this.perishData.from);
			this.ripple.handleCheatedNodes(this.cheatedNodes);
		}
		else
		{
			this.cheatedNodes.push(this.perishData.from);
			this.ripple.handleCheatedNodes(this.cheatedNodes);
		}
	}

	/**
	 * @param {Buffer} address
	 */
	killNode(address)
	{
		if(this.state === PERISH_STATUS_PROCESSING)
		{
			return;
		}

		this.state = PERISH_STATUS_PROCESSING;

		this.perishData = new PerishData({
			address: address,
			timestamp: Date.now()
		});

		perishData.sign(privateKey);

		this.finish.initFinishTimeout();
		p2p.sendAll(PROTOCOL_CMD_KILL_NODE_REQUEST, perishData.serialize());

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
			case PROTOCOL_CMD_KILL_NODE_REQUEST:
			{
				if(this.state === PERISH_STATUS_PROCESSING)
				{
					return;
				}

				this.state = PERISH_STATUS_PROCESSING;

				//
				this.perishData = new PerishData(data);
				if(perishData.validate())
				{
					if(address.toString("hex") !== perishData.from.toString("hex"))
					{
						this.cheatedNodes.push(address);

						logger.error(`Perish handleMessage, address is invalid, address should be ${address.toString("hex")}, now is ${counterData.from.toString("hex")}`);
					}
					else
					{
						this.finish.initFinishTimeout();
						p2p.sendAll(PROTOCOL_CMD_KILL_NODE_STATUS_REQUEST, perishData.address);
					}
				}
				else
				{
					this.cheatedNodes.push(address);

					logger.error(`Perish handleMessage, address ${address.toString("hex")}, send an invalid message`);
				}
			}
			break;

			case PROTOCOL_CMD_KILL_NODE_STATUS_REQUEST:
			{
				if(this.ripple.checkIfNodeIsKilled(data))
				{
					p2p.send(address, PROTOCOL_CMD_KILL_NODE_STATUS_RESPONSE, PERISH_DATA_STATE_KILLED);
				}
				else if(this.perishData && this.perishData.address.toString("hex") === data.toString("hex"))
				{
					p2p.send(address, PROTOCOL_CMD_KILL_NODE_STATUS_RESPONSE, PERISH_DATA_STATE_KILLING);
				}
				else
				{
					p2p.send(address, PROTOCOL_CMD_KILL_NODE_STATUS_RESPONSE, PERISH_DATA_STATE_NOT_KILLED);
				}
			}
			break;

			case PROTOCOL_CMD_KILL_NODE_STATUS_RESPONSE:
			{
				if(this.state !== PERISH_STATUS_PROCESSING)
				{
					return;
				}

				const perishDataState = bufferToInt(data);

				if(perishDataState === PERISH_DATA_STATE_KILLED || perishDataState === PERISH_DATA_STATE_KILLING)
				{
					this.finish.recordFinishNode(address.toString("hex"));
				}
			}
			break;
		}
	}
}

module.exports = Perish;