const { unl } = require("../../config.json");
const { RIPPLE_STATE_STAGE_CONSENSUS, STAGE_DATA_EXCHANGE_TIMEOUT, STAGE_STAGE_SYNCHRONIZE_TIMEOUT, STAGE_MAX_FINISH_RETRY_TIMES, AVERAGE_TIME_STATISTIC_MAX_TIMES, STAGE_STATE_EMPTY, STAGE_STATE_DATA_EXCHANGE_PROCEEDING, STAGE_STATE_DATA_EXCHANGE_FINISH_SUCCESS_AND_SYNCHRONIZE_PROCEEDING, STAGE_STATE_DATA_EXCHANGE_FINISH_TIMEOUT_AND_SYNCHRONIZE_PROCEEDING } = require("../../constant");
const process = require("process");
const utils = require("../../../depends/utils");
const assert = require("assert");
const Sender = require("../sender");

const stripHexPrefix = utils.stripHexPrefix;
const rlp = utils.rlp;
const toBuffer = utils.toBuffer;
const bufferToInt = utils.bufferToInt;

const logger = process[Symbol.for("loggerStageConsensus")];
const p2p = process[Symbol.for("p2p")];
const mysql = process[Symbol.for("mysql")];

class Stage
{
	constructor(opts)
	{
		this.state = STAGE_STATE_EMPTY;

		// timeout nodes
		this.otherTimeoutNodes = [];
		this.ownTimeoutNodes = [];

		// cheated nodes
		this.cheatedNodes = [];

		// compute synchronize times
		this.totalSynchronizeTime = 0;
		this.leftSynchronizeTryTimes = STAGE_MAX_FINISH_RETRY_TIMES;

		this.synchronize_state_request_cmd = opts.synchronize_state_request_cmd;
		this.synchronize_state_response_cmd = opts.synchronize_state_response_cmd;
		this.name = opts.name;

		this.dataExchange = new Sender(result => {
			// record data exchange time consume
			mysql.saveDataExchangeTimeConsume(this.ripple.stage, this.dataExchange.consensusTimeConsume).catch(e => {
				logger.error(`Stage dataExchange, ${this.ripple.state === RIPPLE_STATE_STAGE_CONSENSUS ? 'transaction consensus' : 'stage consensus'}, stage: ${this.ripple.stage}, saveDataExchangeTimeConsume throw exception, ${e}`);
			});

			if(result)
			{
				logger.info(`Stage, ${this.ripple.state === RIPPLE_STATE_STAGE_CONSENSUS ? 'transaction consensus' : 'stage consensus'}, stage: ${this.ripple.stage}, dataExchange is over success`);

				this.state = STAGE_STATE_DATA_EXCHANGE_FINISH_SUCCESS_AND_SYNCHRONIZE_PROCEEDING;
			}
			else
			{
				// record the timeout node
				for(let i = 0; i < unl.length; i++)
				{
					if(!this.dataExchange.finishAddresses.has(stripHexPrefix(unl[i].address)))
					{
						this.ownTimeoutNodes.push(unl[i].address);
					}
				}

				//
				logger.fatal(`Stage, ${this.ripple.state === RIPPLE_STATE_STAGE_CONSENSUS ? 'transaction consensus' : 'stage consensus'}, stage: ${this.ripple.stage}, dataExchange is over because of timeout`);

				this.state = STAGE_STATE_DATA_EXCHANGE_FINISH_TIMEOUT_AND_SYNCHRONIZE_PROCEEDING;
			}

			this.stageSynchronize.start();
			p2p.sendAll(this.synchronize_state_request_cmd);

		}, STAGE_DATA_EXCHANGE_TIMEOUT);

		this.stageSynchronize = new Sender(result => {
			this.totalSynchronizeTime += this.stageSynchronize.consensusTimeConsume;

			if(result)
			{
				logger.info(`Stage, ${this.ripple.state === RIPPLE_STATE_STAGE_CONSENSUS ? 'transaction consensus' : 'stage consensus'}, stage: ${this.ripple.stage}, stage synchronize is over success`);

				// record synchronize time consume
				mysql.saveStageSynchronizeTimeConsume(this.ripple.stage, this.dataExchange.consensusTimeConsume).catch(e => {
					logger.error(`Stage stageSynchronize, ${this.ripple.state === RIPPLE_STATE_STAGE_CONSENSUS ? 'transaction consensus' : 'stage consensus'}, stage: ${this.ripple.stage}, saveStageSynchronizeTimeConsume throw exception, ${e}`);
				});

				//
				this.handler(true);
				this.ripple.handleTimeoutNodes(this.ownTimeoutNodes, this.otherTimeoutNodes);
				this.ripple.handleCheatedNodes(this.cheatedNodes);
				this.reset();
			}
			else
			{
				// record the timeout node
				for(let i = 0; i < unl.length; i++)
				{
					if(!this.stageSynchronize.finishAddresses.has(stripHexPrefix(unl[i].address)))
					{
						this.ownTimeoutNodes.push(unl[i].address);
					}
				}

				if(this.leftSynchronizeTryTimes > 0)
				{
					logger.info(`Stage, ${this.ripple.state === RIPPLE_STATE_STAGE_CONSENSUS ? 'transaction consensus' : 'stage consensus'}, stage: ${this.ripple.stage}, stage synchronize is failed, retry ${STAGE_MAX_FINISH_RETRY_TIMES - this.leftSynchronizeTryTimes + 1}`);

					this.stageSynchronize.reset();
					this.stageSynchronize.start();
					p2p.sendAll(this.synchronize_state_request_cmd);

					this.leftSynchronizeTryTimes -= 1;
				}
				else
				{
					logger.fatal(`Stage, ${this.ripple.state === RIPPLE_STATE_STAGE_CONSENSUS ? 'transaction consensus' : 'stage consensus'}, stage: ${this.ripple.stage}, stage synchronize is over because of timeout`);

					// record synchronize time consume
					mysql.saveStageSynchronizeTimeConsume(this.ripple.stage, this.dataExchange.consensusTimeConsume).catch(e => {
						logger.error(`Stage, ${this.ripple.state === RIPPLE_STATE_STAGE_CONSENSUS ? 'transaction consensus' : 'stage consensus'}, stage: ${this.ripple.stage}, saveStageSynchronizeTimeConsume throw exception, ${e}`);
					});

					//
					this.handler(false);
					this.ripple.handleTimeoutNodes(this.ownTimeoutNodes, this.otherTimeoutNodes);
					this.ripple.handleCheatedNodes(this.cheatedNodes);
					this.reset();
				}
			}
		}, STAGE_STAGE_SYNCHRONIZE_TIMEOUT);
	}

	start()
	{
		this.state = STAGE_STATE_DATA_EXCHANGE_PROCEEDING;
		this.dataExchange.start();
	}

	/**
	 * @param {String} address
	 */
	recordDataExchangeFinishNode(address)
	{
		assert(typeof address === "string", `Stage recordDataExchangeFinishNode, address should be a String, now is ${typeof address}`);

		this.dataExchange.recordFinishNode(address);
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
			case this.synchronize_state_request_cmd:
			{
				// compute timeout nodes
				let timeoutAddresses = [];
				if(this.state === STAGE_STATE_DATA_EXCHANGE_FINISH_TIMEOUT_AND_SYNCHRONIZE_PROCEEDING || this.state === STAGE_STATE_DATA_EXCHANGE_FINISH_SUCCESS_AND_SYNCHRONIZE_PROCEEDING)
				{
					for(let i = 0; i < unl.length; i++)
					{
						if(!this.dataExchange.finishAddresses.has(stripHexPrefix(unl[i].address)))
						{
							timeoutAddresses.push(unl[i].address);
						}

						if(!this.stageSynchronize.finishAddresses.has(stripHexPrefix(unl[i].address)))
						{
							timeoutAddresses.push(unl[i].address);
						}
					}
					
					// filter the same timeoutAddresses
					timeoutAddresses = [...new Set(timeoutAddresses)];
				}
				
				//
				p2p.send(address, this.synchronize_state_response_cmd, rlp.encode([toBuffer(this.state), timeoutAddresses]));
			}
			break;
			case this.synchronize_state_response_cmd:
			{
				const nodeInfo = rlp.decode(data);
				const state = bufferToInt(nodeInfo[0]);
				const timeoutAddresses = [...new Set(nodeInfo[1])];

				if(state === STAGE_STATE_DATA_EXCHANGE_PROCEEDING)
				{
					const addressHex = address.toString("hex");

					this.otherTimeoutNodes.push(addressHex)
				}
				else if(state === STAGE_STATE_DATA_EXCHANGE_FINISH_TIMEOUT_AND_SYNCHRONIZE_PROCEEDING)
				{
					// record timeout nodes
					timeoutAddresses.forEach(address => {
						const addressHex = address.toString("hex");
						
						this.otherTimeoutNodes.push(addressHex);
					});

					this.stageSynchronize.recordFinishNode(address.toString("hex"));
				}
				else if(state === STAGE_STATE_DATA_EXCHANGE_FINISH_SUCCESS_AND_SYNCHRONIZE_PROCEEDING)
				{
					this.stageSynchronize.recordFinishNode(address.toString("hex"));
				}
				else
				{
					logger.fatal(`Stage handleMessage, ${this.ripple.state === RIPPLE_STATE_STAGE_CONSENSUS ? 'transaction consensus' : 'stage consensus'}, stage: ${this.ripple.stage}, stage state is empty, can not process messages`);

					process.exit(1);
				}
			}
		}
	}

	reset()
	{
		this.ownTimeoutNodes = [];
		this.otherTimeoutNodes = [];

		this.state = STAGE_STATE_EMPTY;
		this.leftSynchronizeTryTimes = STAGE_MAX_FINISH_RETRY_TIMES;

		this.dataExchange.reset();
		this.stageSynchronize.reset();
	}

	checkIfDataExchangeIsFinish()
	{
		return this.state === STAGE_STATE_DATA_EXCHANGE_FINISH_TIMEOUT_AND_SYNCHRONIZE_PROCEEDING || this.state === STAGE_STATE_DATA_EXCHANGE_FINISH_SUCCESS_AND_SYNCHRONIZE_PROCEEDING;
	}

	checkDataExchangeIsProceeding()
	{
		return this.state === STAGE_STATE_DATA_EXCHANGE_PROCEEDING;
	}
}

module.exports = Stage;