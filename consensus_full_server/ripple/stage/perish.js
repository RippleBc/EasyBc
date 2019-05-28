const PerishData = require("../data/perish");
const { unl } = require("../../config.json");
const utils = require("../../../depends/utils");
const process = require("process");
const AsyncEventemitter = require("async-eventemitter");
const Sender = require("../sender");
const Stage = require("./stage");
const { TRANSACTIONS_CONSENSUS_THRESHOULD, PROTOCOL_CMD_KILL_NODE_FINISH_STATE_REQUEST, PROTOCOL_CMD_KILL_NODE_FINISH_STATE_RESPONSE, PERISH_DATA_PERIOD_OF_VALID, STAGE_STATE_EMPTY, RIPPLE_STAGE_PERISH_NODE, PROTOCOL_CMD_KILL_NODE_REQUEST, PROTOCOL_CMD_KILL_NODE_RESPONSE } = require("../../constant");

const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerPerishNode")];
const privateKey = process[Symbol.for("privateKey")];

class Perish extends Stage
{
	constructor(ripple)
	{
		super({
			synchronize_state_request_cmd: PROTOCOL_CMD_KILL_NODE_FINISH_STATE_REQUEST,
			synchronize_state_response_cmd: PROTOCOL_CMD_KILL_NODE_FINISH_STATE_RESPONSE
		});

		this.ripple = ripple;

		this.ownPerishData = undefined
		this.allPerishData = [];
	}

	handler(ifSuccess)
	{
		if(ifSuccess)
		{
			logger.fatal("Perish handler, perish node success")
		}
		else
		{	
			logger.fatal("Perish handler, perish node success because of timeout")
		}

		const perishDataMap = new Map();
		for(let perishData of allPerishData)
		{
			const key = perishData.hash()

			if(perishDataMap.has(key))
			{
				const count = perishDataMap.get(key).count;

				perishDataMap.set(key, {
					count: count + 1,
					data: perishData
				})
			}
			else
			{
				perishDataMap.set(key, {
					count: 1,
					data: perishData
				})
			}
		}
		const sortedPerishNodeAddresses = [...perishDataMap].sort(perishData => -perishData[1].count);
		if(sortedPerishNodeAddresses[0] && sortedPerishNodeAddresses[0][1].count / (unl.length + 1) >= TRANSACTIONS_CONSENSUS_THRESHOULD)
		{
			const perishData = sortedPerishNodeAddresses[0][1].data

			logger.fatal(`Perish handler, begin to handle vicious node, sponsor node: ${perishData.from.toString('hex')}, perish node: ${perishData.address.toString('hex')}`)

			this.ripple.handlePerishNode(perishData.from, perishData.address);
		}
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
				if(this.state === STAGE_STATE_EMPTY)
				{
					const perishData = new PerishData(data);
					if(perishData.validate())
					{
						// check if perishData timestamp is valid
						if(bufferToInt(perishData.timestamp) + PERISH_DATA_PERIOD_OF_VALID > Date.now())
						{
							this.startKillNode(perishData);
						}
						else
						{
							this.cheatedNodes.push(address);
						}
					}
					else
					{
						this.cheatedNodes.push(address);

						logger.error(`Perish handleMessage, address ${address.toString("hex")}, send an invalid message`);
					}
				}

				p2p.send(address, PROTOCOL_CMD_KILL_NODE_RESPONSE, this.ownPerishData.serialize());
			}
			break;
			case PROTOCOL_CMD_KILL_NODE_RESPONSE:
			{
				if(this.state === STAGE_STATE_EMPTY)
				{
					return;
				}

				const perishData = new PerishData(data);
				if(perishData.validate())
				{
					// check if perishData timestamp is valid
					if(bufferToInt(perishData.timestamp) + PERISH_DATA_PERIOD_OF_VALID > Date.now())
					{
						this.allPerishData.push(perishData);

						this.recordDataExchangeFinishNode(address.toString("hex"));
					}
					else
					{
						this.cheatedNodes.push(address);
					}
				}
				else
				{
					this.cheatedNodes.push(address);

					logger.error(`Perish handleMessage, address ${address.toString("hex")}, send an invalid message`);
				}
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

	reset()
	{
		super.reset();

		this.ownPerishData = undefined;
		this.allPerishData = [];
	}

	/**
	 * @param {Buffer} address
	 * @return {PerishData} 
	 */
	assemblePerishData(address)
	{
		assert(Buffer.isBuffer(address), `Perish assemblePerishData, address should be a Buffer, now is ${typeof address}`);

		const perishData = new PerishData({
			address: address,
			timestamp: Date.now()
		});

		perishData.sign(privateKey);

		return perishData;
	}

	/**
	 * @param {PerishData} perishData
	 */
	startKillNode(perishData)
	{
		assert(perishData instanceof PerishData, `Perish assemblePerishData, perishData should be a PerishData instance, now is ${typeof address}`);

		this.ownPerishData = perishData;
		this.allPerishData.push(perishData)

		this.start();

		this.ripple.reset();
		this.ripple.counter.reset();

		this.ripple.state = RIPPLE_STAGE_PERISH_NODE;
		
		p2p.sendAll(PROTOCOL_CMD_KILL_NODE_REQUEST, perishData.serialize());
	}
}

module.exports = Perish;