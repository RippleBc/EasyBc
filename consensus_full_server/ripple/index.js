const Amalgamate = require("./stage/amalgamate");
const CandidateAgreement = require("./stage/candidateAgreement");
const BlockAgreement = require("./stage/blockAgreement");
const { RIPPLE_STAGE_AMALGAMATE, RIPPLE_STAGE_CANDIDATE_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT, RIPPLE_STAGE_PERISH_PROCESSING_CHEATED_NODES, RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK, RIPPLE_STAGE_COUNTER_FETCHING_NEW_TRANSACTIONS, CHEAT_REASON_INVALID_PROTOCOL_CMD, RIPPLE_STAGE_PERISH, RIPPLE_STAGE_EMPTY, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE, RIPPLE_STAGE_COUNTER, MAX_PROCESS_TRANSACTIONS_SIZE } = require("../constant");
const assert = require("assert");
const Counter = require("./stage/counter");
const Perish = require("./stage/perish");

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const mysql = process[Symbol.for("mysql")];
const loggerStageConsensus = process[Symbol.for("loggerStageConsensus")];
const loggerPerishNode = process[Symbol.for("loggerPerishNode")];
const unlManager = process[Symbol.for("unlManager")]

class Ripple
{
	constructor(processor)
	{
		this.processor = processor;

		this.stage = RIPPLE_STAGE_EMPTY;

		this.counter = new Counter(this);
		this.perish = new Perish(this);
		this.amalgamate = new Amalgamate(this);
		this.candidateAgreement = new CandidateAgreement(this);
		this.blockAgreement = new BlockAgreement(this);

		// used for cache transactions that is consensusing
		this.processingTransactions = [];

		// used for cache amalgamate message
		this.amalgamateMessagesCacheBlockAgreement = [];
		this.amalgamateMessagesCacheCounter = [];
		this.amalgamateMessagesCachePerish = [];
	}

	/**
	 * @param {Array} transactions 
	 */
	async run({fetchingNewTransaction = false, transactions} = {fetchingNewTransaction: false})
	{
		if(fetchingNewTransaction)
		{
			assert(Array.isArray(transactions), `Ripple run, transactions should be an Array, now is ${typeof transactions}`)

			this.processingTransactions = transactions;
		}
		
		this.amalgamate.run(this.processingTransactions);
	}

	/*
	 * @return {Object} 
	 *  - {Array} transactions
	 *  - {Function} deleteTransactions
	 */
	async getNewTransactions()
	{
		return await mysql.getRawTransactions(MAX_PROCESS_TRANSACTIONS_SIZE);
	}

	/**
	 * @param {Array}
	 */
	setProcessingTransactions(transactions)
	{
		assert(Array.isArray(transactions), `Ripple setProcessingTransactions, transactions should be an Array, now is ${typeof transactions}`);

		this.processingTransactions = transactions;
	}

	checkIfInTransactionConsensusProcessing()
	{
		return this.stage === RIPPLE_STAGE_AMALGAMATE 
		|| this.stage === RIPPLE_STAGE_CANDIDATE_AGREEMENT 
		|| this.stage === RIPPLE_STAGE_BLOCK_AGREEMENT 
		|| this.stage === RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK
	}

	/**
	 * @param {String} sponsorNode
	 * @param {String} perishNode
	 */
	async handlePerishNode(sponsorNode, perishNode)
	{
		assert(typeof sponsorNode === 'string', `Ripple handlePerishNode, sponsorNode should be an String, now is ${typeof sponsorNode}`);
		assert(typeof perishNode === 'string', `Ripple handlePerishNode, perishNode should be an String, now is ${typeof perishNode}`);
		
		await unlManager.setNodesMalicious([sponsorNode, perishNode])
	}

	/**
	 * @param {Array} cheatedNodes
	 */
	handleCheatedNodes(cheatedNodes)
	{
		assert(Array.isArray(cheatedNodes), `Ripple handleCheatedNodes, cheatedNodes should be an Buffer, now is ${typeof cheatedNodes}`);

		cheatedNodes.forEach(cheatedNode => {
			mysql.saveCheatedNode(cheatedNode.address, cheatedNode.reason).catch(e => {
				logger.fatal(`Ripple handleCheatedNodes, saveCheatedNode throw exception, ${process[Symbol.for("getStackInfo")](e)}`);
				
				process.exit(1)
			});
		});
	}

	/**
	 * @param {Array} timeoutNodes
	 */
	handleTimeoutNodes(timeoutNodes)
	{
		assert(Array.isArray(timeoutNodes), `Ripple handleTimeoutNodes, timeoutNodes should be an Array, now is ${typeof timeoutNodes}`);
		
		timeoutNodes.forEach(timeoutNode => {
			mysql.saveTimeoutNode(timeoutNode.address, timeoutNode.reason).catch(e => {
				logger.fatal(`Ripple handleTimeoutNodes, saveTimeoutNode throw exception, ${process[Symbol.for("getStackInfo")](e)}`);
				
				process.exit(1)
			})
		});
	}

	/**
	 * @param {Buffer} address
	 */
	perishNode(address)
	{
		this.perish.startPerishNode({
			address: address
		});
	}

	/**
	 * @param {Array/String} address
	 */
	async pardonNodes(addresses)
	{
		assert(Array.isArray(addresses), `Ripple pardonNodes, addresses should be an Array, now is ${typeof addresses}`)

		await unlManager.setNodesRighteous(addresses)
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
			if(this.stage === RIPPLE_STAGE_PERISH)
			{
				if(this.perish.checkIfDataExchangeIsFinish())
				{
					loggerPerishNode.info("Ripple handleMessage, perish node success because of node notification");

					this.perish.handler({
						ifSuccess: true,
						ifCheckState: true
					});
				}
				else
				{
					return loggerPerishNode.warn(`Ripple handleMessage, address ${address.toString("hex")}, processor is perishing node, do not handle transaction consensus messages`);
				}
			}

			if(this.stage === RIPPLE_STAGE_COUNTER)
			{
				if(this.counter.checkIfDataExchangeIsFinish())
				{
					loggerStageConsensus.info("Ripple handleMessage, sync stage success because of node notification");

					this.counter.handler({
						ifSuccess: true,
						ifCheckState: true
					});
				}
				else
				{
					return loggerStageConsensus.warn(`Ripple handleMessage, address ${address.toString("hex")}, processor is synchronizing stage, do not transactions amalgamate messages`);
				}
			}

			if(this.stage === RIPPLE_STAGE_BLOCK_AGREEMENT && this.blockAgreement.checkIfDataExchangeIsFinish())
			{
				logger.info(`Ripple handleMessage, block agreement is over because of node notification`);

				this.blockAgreement.handler({
					ifSuccess: true,
					ifCheckState: true
				});
			}
			

			if(this.stage === RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK)
			{
				this.amalgamateMessagesCacheBlockAgreement.push({
					address: address,
					cmd: cmd,
					data: data
				});
			}
			else if(this.stage === RIPPLE_STAGE_COUNTER_FETCHING_NEW_TRANSACTIONS)
			{
				this.amalgamateMessagesCacheCounter.push({
					address: address,
					cmd: cmd,
					data: data
				});
			}
			else if(this.stage === RIPPLE_STAGE_PERISH_PROCESSING_CHEATED_NODES)
			{
				this.amalgamateMessagesCachePerish.push({
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
				logger.info(`Ripple handleMessage, address ${address.toString("hex")}, own stage ${this.stage}, other stage is amalgamate`);

				p2p.send(address, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE);
			}
		}
		else if(cmd >= 200 && cmd < 300)
		{
			if(this.stage === RIPPLE_STAGE_PERISH)
			{
				return loggerPerishNode.warn(`Ripple handleMessage, address ${address.toString("hex")}, processor is perishing node, do not handle transaction consensus messages`);
			}

			if(this.stage === RIPPLE_STAGE_COUNTER)
			{
				return loggerStageConsensus.warn(`Ripple handleMessage, address ${address.toString("hex")}, processor is synchronizing stage, do not handle candidates agreement messages`);
			}

			if(this.amalgamate.checkIfDataExchangeIsFinish())
			{
				logger.info(`Ripple handleMessage, amalgamate is over because of node notification`);

				this.amalgamate.handler({
					ifSuccess: true,
					ifCheckState: true
				});
			}

			if(this.candidateAgreement.checkDataExchangeIsProceeding() || this.candidateAgreement.checkIfDataExchangeIsFinish())
			{
				this.candidateAgreement.handleMessage(address, cmd, data);
			}
			else
			{
				logger.info(`Ripple handleMessage, address ${address.toString("hex")}, own stage ${this.stage}, other stage is candidateAgreement`);

				p2p.send(address, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE);
			}
		}
		else if(cmd >= 300 && cmd < 400)
		{
			if(this.stage === RIPPLE_STAGE_PERISH)
			{
				return loggerPerishNode.warn(`Ripple handleMessage, address ${address.toString("hex")}, processor is perishing node, do not handle transaction consensus messages`);
			}

			if(this.stage === RIPPLE_STAGE_COUNTER)
			{
				return loggerStageConsensus.warn(`Ripple handleMessage, address ${address.toString("hex")}, processor is synchronizing stage, do not handle blocks agreement messages`);
			}

			if(this.candidateAgreement.checkIfDataExchangeIsFinish())
			{
				logger.info(`Ripple handleMessage, candidate agreement is over because of node notification`);

				this.candidateAgreement.handler({
					ifSuccess: true,
					ifCheckState: true
				});
			}
			
			if(this.blockAgreement.checkDataExchangeIsProceeding() || this.blockAgreement.checkIfDataExchangeIsFinish())
			{
				this.blockAgreement.handleMessage(address, cmd, data);
			}
			else
			{
				logger.info(`Ripple handleMessage, address ${address.toString("hex")}, own stage ${this.stage}, other stage is blockAgreement`);

				p2p.send(address, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE);
			}
		}
		else if(cmd >= 400 && cmd < 500)
		{
			if(this.stage === RIPPLE_STAGE_PERISH)
			{
				return loggerPerishNode.warn(`Ripple handleMessage, address ${address.toString("hex")}, processor is perishing node, do not handle stage synchronize messages`);
			}

			this.counter.handleMessage(address, cmd, data);
		}
		else if(cmd >= 500 && cmd < 600)
		{
			this.perish.handleMessage(address, cmd, data);
		}
		else
		{
			logger.error(`Ripple handleMessage, address ${address.toString("hex")}, invalid cmd: ${cmd}`);

			this.handleCheatedNodes({
				address: address.toString("hex"),
				reason: CHEAT_REASON_INVALID_PROTOCOL_CMD
			});
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