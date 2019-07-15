const PerishData = require("../data/perish");
const utils = require("../../../depends/utils");
const Stage = require("./stage");
const { RIPPLE_STAGE_PERISH_PROCESSING_CHEATED_NODES, CHEAT_REASON_PERISH_DATA_INVALID_TIMESTAMP, CHEAT_REASON_INVALID_SIG, TRANSACTIONS_CONSENSUS_THRESHOULD, PROTOCOL_CMD_KILL_NODE_FINISH_STATE_REQUEST, PROTOCOL_CMD_KILL_NODE_FINISH_STATE_RESPONSE, STAGE_STATE_EMPTY, RIPPLE_STATE_PERISH_NODE, PROTOCOL_CMD_KILL_NODE_REQUEST, PROTOCOL_CMD_KILL_NODE_RESPONSE } = require("../../constant");
const _ = require("underscore");
const { randomBytes } = require("crypto");
const assert = require("assert");

const bufferToInt = utils.bufferToInt;
const BN = utils.BN;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerPerishNode")];
const unlManager = process[Symbol.for("unlManager")];

const PERISH_DATA_TIMESTAMP_CHEATED_LEFT_GAP = 60 * 1000;
const PERISH_DATA_TIMESTAMP_CHEATED_RIGHT_GAP = 60 * 1000;

const PERISH_DATA_TIMESTAMP_STOP_SPREAD_LEFT_GAP = 30 * 1000;
const PERISH_DATA_TIMESTAMP_STOP_SPREAD_RIGHT_GAP = 30 * 1000;

const getRandomPerishInterval = function()
{
	return new BN(randomBytes(2)).toNumber() % 5000;
}

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
			logger.info("Perish handler, perish node success")
		}
		else
		{	
			logger.info("Perish handler, perish node success because of timeout")
		}

		const perishDataMap = new Map();
		for(let perishData of this.perishDatas)
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

		// statistic vote result
		const sortedPerishData = _.sortBy([...perishDataMap], perishData => -perishData[1]);

		const fullUnl = unlManager.fullUnl;

		if(sortedPerishData[0] && sortedPerishData[0][1] / (fullUnl.length + 1) >= TRANSACTIONS_CONSENSUS_THRESHOULD)
		{
			const perishAddress = sortedPerishData[0][0];

			// compute perish address
			let perishSponsors = []
			for(let perishData of this.perishDatas)
			{
				if(perishData.address.toString('hex') === perishAddress)
				{
					perishSponsors.push(perishData.from.toString("hex"))
				}
			}
			perishSponsors = _.sortBy(perishSponsors, perishSponsor => {
				return perishSponsor;
			});

			logger.warn(`Perish handler, begin to handle vicious node, sponsor node: ${perishData.from.toString('hex')}, perish node: ${perishData.address.toString('hex')}`)

			this.ripple.stage = RIPPLE_STAGE_PERISH_PROCESSING_CHEATED_NODES;

			this.reset();

			// handle perish node
			this.ripple.handlePerishNode(perishSponsors[0], perishAddress).then(() => {
				
				this.ripple.run(true);

				// handle cached messages
				for(let i = 0; i < this.ripple.amalgamateMessagesCache.length; i++)
				{
					let {address, cmd, data} = this.ripple.amalgamateMessagesCache[i];
					this.ripple.amalgamate.handleMessage(address, cmd, data);
				}

				this.ripple.amalgamateMessagesCache = [];	
				
				// begin to perish node again
				if(this.ifActive && this.perishData.address.toString('hex') !== perishData.address.toString('hex'))
				{
					const waitTime = getRandomPerishInterval()

					setTimeout(() => {
						this.startPerishNode({
							address: this.perishData.address
						});
					}, waitTime)
				}
			}).catch(e => {
				logger.fatal(`Perish handler, this.ripple.handlePerishNode throw exception, ${process[Symbol.for("getStackInfo")](e)}`)

				process.exit(1);
			});
		}
		else
		{
			// debug
			let perishDataInfo = ''
			for(let perishAddress of perishDataMap)
			{
				perishDataInfo += `perishAddress: ${perishAddress}, count: ${perishDataMap.get(perishAddress)}, `
			}
			perishDataInfo = perishDataInfo.slice(0, -1);
			logger.warn(`Perish handler, handle vicious node failed, ${perishDataInfo}`)

			this.reset();

			this.ripple.run(true);
			
			// begin to perish node again
			if(this.ifActive)
			{
				const waitTime = getRandomPerishInterval()

				setTimeout(() => {
					this.startPerishNode({
						address: this.perishData.address
					});
				}, waitTime)
			}
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
								this.startPerishNode({
									perishData: perishData
								});
							}
						}

						p2p.send(address, PROTOCOL_CMD_KILL_NODE_RESPONSE, this.perishData.serialize());
					}).catch(e => {
						this.logger.fatal(`Perish handleMessage, checkIfPerishRepeated throw exception, ${process[Symbol.for("getStackInfo")](e)}`);

						process.exit(1);
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
	 * @param {PerishData} perishData
	 */
	startPerishNode({address, perishData})
	{
		if(this.state !== STAGE_STATE_EMPTY)
		{
			return;
		}

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