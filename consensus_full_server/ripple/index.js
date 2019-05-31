const Amalgamate = require("./stage/amalgamate");
const CandidateAgreement = require("./stage/candidateAgreement");
const BlockAgreement = require("./stage/blockAgreement");
const { RIPPLE_STATE_PERISH_NODE, RIPPLE_STAGE_EMPTY, STAGE_MAX_FINISH_RETRY_TIMES, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE, RIPPLE_STATE_STAGE_CONSENSUS, RIPPLE_STATE_TRANSACTIONS_CONSENSUS, MAX_PROCESS_TRANSACTIONS_SIZE, RIPPLE_STAGE_AMALGAMATE, RIPPLE_STAGE_CANDIDATE_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT, RIPPLE_MAX_ROUND } = require("../constant");
const assert = require("assert");
const Counter = require("./stage/counter");
const Perish = require("./stage/perish");
const utils = require("../../depends/utils");

const bufferToInt = utils.bufferToInt;
const rlp = utils.rlp;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const mysql = process[Symbol.for("mysql")];
const loggerStageConsensus = process[Symbol.for("loggerStageConsensus")];
const loggerPerishNode = process[Symbol.for("loggerPerishNode")];

class Ripple
{
	constructor(processor)
	{
		this.processor = processor;

		this.state = RIPPLE_STATE_TRANSACTIONS_CONSENSUS;
		this.stage = RIPPLE_STAGE_EMPTY;

		this.counter = new Counter(this);
		this.perish = new Perish(this);
		this.amalgamate = new Amalgamate(this);
		this.candidateAgreement = new CandidateAgreement(this);
		this.blockAgreement = new BlockAgreement(this);

		// used for cache transactions that is consensusing
		this.processingTransactions = [];

		// used for cache amalgamate message
		this.amalgamateMessagesCache = [];
	}

	/*
	 * @param {Boolean} ifRetry
	 */
	async run(ifRetry = false)
	{
		if(!ifRetry)
		{
			this.processingTransactions = await this.processor.getTransactions(MAX_PROCESS_TRANSACTIONS_SIZE);
			
			this.state = RIPPLE_STATE_TRANSACTIONS_CONSENSUS;
			this.amalgamate.run(this.processingTransactions);

			return;
		}

		this.state = RIPPLE_STATE_TRANSACTIONS_CONSENSUS;
		this.amalgamate.run(this.processingTransactions);
	}

	/**
	 * @param {Buffer} sponsorNode
	 * @param {Buffer} perishNode
	 */
	handlePerishNode(sponsorNode, perishNode)
	{
		assert(Buffer.isBuffer(sponsorNode), `Ripple handlePerishNode, sponsorNode should be an Buffer, now is ${typeof sponsorNode}`);
		assert(Buffer.isBuffer(perishNode), `Ripple handlePerishNode, perishNode should be an Buffer, now is ${typeof perishNode}`);
		
		this.run(true);
	}

	/**
	 * @param {Array/Buffer} addresses
	 */
	handleCheatedNodes(addresses)
	{
		assert(Array.isArray(addresses), `Ripple handleCheatedNodes, addresses should be an Buffer, now is ${typeof addresses}`);

		addresses.forEach(address => {
			address = address.toString("hex");
			mysql.saveCheatedNode(address).catch(e => {
				logger.error(`Ripple handleCheatedNodes, saveCheatedNode throw exception, ${e}`);
			});
		});
	}

	/**
	 * @param {Array/String} ownTimeoutNodes
	 * @param {Array/String} otherTimeoutNodes
	 */
	handleTimeoutNodes(ownTimeoutNodes, otherTimeoutNodes)
	{
		assert(Array.isArray(ownTimeoutNodes), `Ripple handleTimeoutNodes, ownTimeoutNodes should be an Array, now is ${typeof ownTimeoutNodes}`);
		assert(Array.isArray(otherTimeoutNodes), `Ripple otherTimeoutNodes, otherTimeoutNodes should be an Array, now is ${typeof otherTimeoutNodes}`);
		
		const self = this;
		ownTimeoutNodes.forEach(ownTimeoutNode => {
			mysql.saveTimeoutNode(ownTimeoutNode).catch(e => {
				logger.error(`Ripple handleTimeoutNodes, saveTimeoutNode throw exception, ${e}`);
			})
		});

		otherTimeoutNodes.forEach(otherTimeoutNode => {
			mysql.saveTimeoutNode(otherTimeoutNode).catch(e => {
				logger.error(`Ripple handleTimeoutNodes, saveTimeoutNode throw exception, ${e}`);
			})
		});
	}

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage(address, cmd, data)
	{	
		assert(Buffer.isBuffer(address), `Ripple handleMessage, address should be an Buffer, now is ${typeof address}`);
		assert(typeof cmd === "number", `Ripple handleMessage, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(data), `Ripple handleMessage, data should be an Buffer, now is ${typeof data}`);

		if(cmd >= 100 && cmd < 200)
		{
			if(this.state === RIPPLE_STATE_PERISH_NODE)
			{
				if(this.perish.checkIfDataExchangeIsFinish())
				{
					loggerPerishNode.warn("Ripple handleMessage, perish node success because of node notification");

					this.perish.handler(true);

					if(this.state === RIPPLE_STATE_TRANSACTIONS_CONSENSUS)
					{
						this.amalgamate.handleMessage(address, cmd, data);
					}
				}
				else
				{
					loggerPerishNode.warn("Ripple handleMessage, processor is perishing node, do not handle transaction consensus messages");
				}

				return
			}

			if(this.state === RIPPLE_STATE_STAGE_CONSENSUS)
			{
				if(this.counter.checkIfDataExchangeIsFinish())
				{
					loggerStageConsensus.warn("Ripple handleMessage, stage synchronize success because of node notification");

					this.counter.handler(true);

					if(this.state === RIPPLE_STATE_TRANSACTIONS_CONSENSUS)
					{
						this.amalgamate.handleMessage(address, cmd, data);
					}
				}
				else
				{
					loggerStageConsensus.warn("Ripple handleMessage, processor is synchronizing stage, do not handle transaction consensus messages");
				}

				return;
			}

			if(this.blockAgreement.checkIfDataExchangeIsFinish())
			{
				logger.info(`Ripple handleMessage, transaction consensus, stage: ${this.stage}, stage synchronize is over because of node notification`);

				this.blockAgreement.handler(true);
			}

			// block agreement is over but, block is still processing, record the messages and process them later
			if(this.blockAgreement.checkIfIsProcessingBlock())
			{
				this.amalgamateMessagesCache.push({
					address: address,
					cmd: cmd,
					data: data
				});
			}
			else if(this.amalgamate.checkDataExchangeIsProceeding() || this.amalgamate.checkIfDataExchangeIsFinish())
			{
				this.amalgamate.handleMessage(address, cmd, data);
			}
			else
			{
				loggerStageConsensus.warn(`Ripple handleMessage, address ${address.toString("hex")}, own stage ${this.stage}, other stage is amalgamate`);

				p2p.send(address, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE);
			}
		}
		else if(cmd >= 200 && cmd < 300)
		{
			if(this.state === RIPPLE_STATE_PERISH_NODE)
			{
				return loggerPerishNode.warn("Ripple handleMessage, processor is perishing node, do not handle transaction consensus messages");
			}

			if(this.state === RIPPLE_STATE_STAGE_CONSENSUS)
			{
				return logger.info(`Ripple handleMessage, processor is synchronizing stage, do not handle transaction consensus messages`);
			}

			if(this.amalgamate.checkIfDataExchangeIsFinish())
			{
				logger.info(`Ripple handleMessage, transaction consensus, stage: ${this.stage}, stage synchronize is over because of node notification`);

				this.amalgamate.handler(true);
			}

			if(this.candidateAgreement.checkDataExchangeIsProceeding() || this.candidateAgreement.checkIfDataExchangeIsFinish())
			{
				this.candidateAgreement.handleMessage(address, cmd, data);
			}
			else
			{
				loggerStageConsensus.warn(`Ripple handleMessage, address ${address.toString("hex")}, own stage ${this.stage}, other stage is candidateAgreement`);

				p2p.send(address, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE);
			}
		}
		else if(cmd >= 300 && cmd < 400)
		{
			if(this.state === RIPPLE_STATE_PERISH_NODE)
			{
				return loggerPerishNode.warn("Ripple handleMessage, processor is perishing node, do not handle transaction consensus messages");
			}

			if(this.state === RIPPLE_STATE_STAGE_CONSENSUS)
			{
				return logger.info(`Ripple handleMessage, processor is synchronizing stage, do not handle transaction consensus messages`);
			}

			if(this.candidateAgreement.checkIfDataExchangeIsFinish())
			{
				logger.info(`Ripple handleMessage, transaction consensus, stage: ${this.stage}, stage synchronize is over because of node notification`);

				this.candidateAgreement.handler(true);
			}
			
			if(this.blockAgreement.checkDataExchangeIsProceeding() || this.blockAgreement.checkIfDataExchangeIsFinish())
			{
				this.blockAgreement.handleMessage(address, cmd, data);
			}
			else
			{
				loggerStageConsensus.warn(`Ripple handleMessage, address ${address.toString("hex")}, own stage ${this.stage}, other stage is blockAgreement`);

				p2p.send(address, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE);
			}
		}
		else if(cmd >= 400 && cmd < 500)
		{
			if(this.state === RIPPLE_STATE_PERISH_NODE)
			{
				return loggerPerishNode.warn("Ripple handleMessage, processor is perishing node, do not handle stage synchronize messages");
			}

			this.counter.handleMessage(address, cmd, data);
		}
		else if(cmd >= 500 && cmd < 600)
		{
			this.perish.handleMessage(address, cmd, data);
		}
		else
		{
			logger.info(`Ripple handleMessage, address ${address.toString("hex")}, invalid cmd: ${cmd}`);
		}
	}

	reset()
	{
		this.amalgamate.reset();
		this.candidateAgreement.reset();
		this.blockAgreement.reset();

		this.stage = RIPPLE_STAGE_EMPTY;
	}
}



module.exports = Ripple;