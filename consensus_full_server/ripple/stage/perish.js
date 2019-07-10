const PerishData = require("../data/perish");
const utils = require("../../../depends/utils");
const Stage = require("./stage");
const { CHEAT_REASON_PERISH_DATA_INVALID_TIMESTAMP, CHEAT_REASON_INVALID_SIG, TRANSACTIONS_CONSENSUS_THRESHOULD, PROTOCOL_CMD_KILL_NODE_FINISH_STATE_REQUEST, PROTOCOL_CMD_KILL_NODE_FINISH_STATE_RESPONSE, STAGE_STATE_EMPTY, RIPPLE_STATE_PERISH_NODE, PROTOCOL_CMD_KILL_NODE_REQUEST, PROTOCOL_CMD_KILL_NODE_RESPONSE } = require("../../constant");
const _ = require("underscore");

const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerPerishNode")];
const privateKey = process[Symbol.for("privateKey")];
const unl = process[Symbol.for("unl")];

const PERISH_DATA_TIMESTAMP_CHEATED_LEFT_GAP = 60 * 1000;
const PERISH_DATA_TIMESTAMP_CHEATED_RIGHT_GAP = 60 * 1000;

const PERISH_DATA_TIMESTAMP_STOP_SPREAD_LEFT_GAP = 30 * 1000;
const PERISH_DATA_TIMESTAMP_STOP_SPREAD_RIGHT_GAP = 30 * 1000;

class Perish extends Stage
{
	constructor(ripple)
	{
		super({
			synchronize_state_request_cmd: PROTOCOL_CMD_KILL_NODE_FINISH_STATE_REQUEST,
			synchronize_state_response_cmd: PROTOCOL_CMD_KILL_NODE_FINISH_STATE_RESPONSE
		});

		this.ripple = ripple;

		this.perishDatas = [];
		this.ifActive = true;
	}

	handler(ifSuccess)
	{
		if(ifSuccess)
		{
			logger.warn("Perish handler, perish node success")
		}
		else
		{	
			logger.warn("Perish handler, perish node success because of timeout")
		}

		const perishDataMap = new Map();
		for(let perishData of perishDatas)
		{
			const perishAddress = perishData.address.toString('hex')

			if(perishDataMap.has(perishAddress))
			{
				const count = perishDataMap.get(perishAddress).count;

				perishDataMap.set(perishAddress, count + 1)
			}
			else
			{
				perishDataMap.set(perishAddress, 1)
			}
		}
		const sortedPerishNodeAddresses = _.sortBy([...perishDataMap], perishData => -perishData[1]);
		if(sortedPerishNodeAddresses[0] && sortedPerishNodeAddresses[0][1] / (unl.length + 1) >= TRANSACTIONS_CONSENSUS_THRESHOULD)
		{
			const perishAddress = sortedPerishNodeAddresses[0][0];

			// compute perish address
			const perishSponsor = ''

			logger.warn(`Perish handler, begin to handle vicious node, sponsor node: ${perishData.from.toString('hex')}, perish node: ${perishData.address.toString('hex')}`)

			this.ripple.handlePerishNode(perishSponsor, perishAddress);

			this.reset();

			if(this.perishData.address.toString('hex') !== perishData.address.toString('hex'))
			{
				return this.startPerishNode({
					address: this.perishData
				});
			}
		}
		else
		{
			if(this.ifActive)
			{
				this.reset();

				return this.startPerishNode({
					address: this.perishData
				});
			}
			
			this.reset();
			this.ripple.run(true);
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
					// check if perish sig and address is valid
					const perishData = new PerishData(data);
					if(!perishData.validate())
					{
						logger.error(`Perish handleMessage, address: ${address.toString("hex")}, validate failed`);

						return this.cheatedNodes.push({
							address: address.toString('hex'),
							reason: CHEAT_REASON_INVALID_SIG
						});
					}
					
					// check timestamp
					const now = Date.now();
					const timestamp = bufferToInt(perishData.timestamp)
					if(timestamp > now + PERISH_DATA_TIMESTAMP_CHEATED_RIGHT_GAP || timestamp < now - PERISH_DATA_TIMESTAMP_CHEATED_LEFT_GAP)
					{
						logger.error(`Perish handleMessage, address: ${address.toString('hex')}, invalid timestamp ${timestamp}, now is ${now}`);

						return this.cheatedNodes.push({
							address: address.toString('hex'),
							reason: CHEAT_REASON_PERISH_DATA_INVALID_TIMESTAMP
						})
					}

					const perishDataHash = perishData.hash().toString("hex");

					// check if repeated
					mysql.checkIfPerishRepeated(perishDataHash).then(repeated => {
						// there is a timewindow here, so should check again, check if already in perish stage
						if(this.state === STAGE_STATE_EMPTY)
						{
							if(repeated)
							{
								logger.error(`Perish handleMessage, perishs data is repeated, address: ${address.toString('hex')}`)

								return this.cheatedNodes.push({
									address: address.toString('hex'),
									reason: CHEAT_REASON_REPEATED_PERISH_DATA
								})
							}

							// 
							if(timestamp < now + PERISH_DATA_TIMESTAMP_STOP_SPREAD_RIGHT_GAP && timestamp > now - PERISH_DATA_TIMESTAMP_STOP_SPREAD_LEFT_GAP)
							{
								// 
								this.ifActive = false;
								this.startPerishNode(perishData);
							}
						}

						p2p.send(address, PROTOCOL_CMD_KILL_NODE_RESPONSE, this.perishData.serialize());
					}).catch(e => {
						this.logger.error(`Perish handleMessage, checkIfPerishRepeated throw exception, ${e}`);
					})
				}
				else
				{
					p2p.send(address, PROTOCOL_CMD_KILL_NODE_RESPONSE, this.perishData.serialize());
				}
				
			}
			break;
			case PROTOCOL_CMD_KILL_NODE_RESPONSE:
			{
				if(this.state === STAGE_STATE_EMPTY)
				{
					return;
				}

				const perishData = new PerishData(data);

				this.validateAndProcessExchangeData(perishData, this.perishDatas, address.toString("hex"), {
					addressCheck: false
				});
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

		this.perishDatas = [];
		this.ifActive = true;
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
	 * @param {Buffer} address
	 * @param {PerishData} perishData
	 */
	startPerishNode({address, perishData})
	{
		if(address === undefined && perishData === undefined)
		{
			throw new Error(`Perish startPerishNode, address and perishData can not be undefined at the same time`);
		}

		if(perishData)
		{
			assert(perishData instanceof PerishData, `Perish startPerishNode, perishData should be an instance of PerishData, now is ${typeof perishData}`);
		}
		else
		{
			assert(Buffer.isBuffer(address), `Perish startPerishNode, address should be an Buffer, now is ${typeof address}`);

			perishData = new PerishData({
				timestamp: Date.now(),
				address: address
			})
		}

		this.start();

		this.ripple.reset();
		this.ripple.counter.reset();
		this.ripple.state = RIPPLE_STATE_PERISH_NODE;

		this.perishData = perishData;
		this.perishDatas.push(perishData)
		
		logger.info(`Perish startPerishNode, begin to send perish node protocol, stage: ${this.ripple.stage}`);

		p2p.sendAll(PROTOCOL_CMD_KILL_NODE_REQUEST, perishData.serialize());
	}
}

module.exports = Perish;