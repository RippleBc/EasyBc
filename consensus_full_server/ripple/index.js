const Amalgamate = require("./stage/amalgamate");
const CandidateAgreement = require("./stage/candidateAgreement");
const BlockAgreement = require("./stage/blockAgreement");
const { STAGE_STATE_EMPTY, CHEAT_REASON_INVALID_PROTOCOL_CMD, RIPPLE_STAGE_EMPTY, MAX_PROCESS_TRANSACTIONS_SIZE } = require("../constant");
const assert = require("assert");

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const mysql = process[Symbol.for("mysql")];
const unlManager = process[Symbol.for("unlManager")]

class Ripple
{
	constructor(processor)
	{
		this.processor = processor;

		this.stage = RIPPLE_STAGE_EMPTY;
		
		this.amalgamate = new Amalgamate(this);
		this.candidateAgreement = new CandidateAgreement(this);
		this.blockAgreement = new BlockAgreement(this);

		// used for cache transactions that is consensusing
		this.processingTransactions = [];
	}

	/**
	 * @param {Array} transactions 
	 */
	run({fetchingNewTransaction = false, transactions} = {fetchingNewTransaction: false})
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
	 * @return {Boolean}
	 */
	perishNode(address)
	{
		if (this.perish.state !== STAGE_STATE_EMPTY)
		{
			return false;
		}
		else
		{
			this.perish.startPerishNodeSpreadMode({
				address: address
			});

			return true;
		}
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
	 * @param {Array} nodes 
	 */
	async addNodes(nodes)
	{
		assert(Array.isArray(nodes), `Ripple addNodes, nodes should be an Array, now is ${typeof nodes}`)

		await unlManager.addNodes(nodes);
	}

	/**
	 * @param {Array} nodes 
	 */
	async updateNodes(nodes)
	{
		assert(Array.isArray(nodes), `Ripple updateNodes, nodes should be an Array, now is ${typeof nodes}`)

		await unlManager.updateNodes({
			nodes: nodes
		});
	}

	/**
	 * @param {Array} nodes 
	 */
	async deleteNodes(nodes) {
		assert(Array.isArray(nodes), `Ripple deleteNodes, nodes should be an Array, now is ${typeof nodes}`)

		await unlManager.deleteNodes(nodes);
	}

	handleMessage()
	{	
		let { address, cmd, data } = {};

		while(address === undefined)
		{
			setTimeout(() => { });

			({ address, cmd, data }) = this.processor.getMessage();
		}

		assert(Buffer.isBuffer(address), `Ripple handleMessage, address should be an Buffer, now is ${typeof address}`);
		assert(typeof cmd === "number", `Ripple handleMessage, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(data), `Ripple handleMessage, data should be an Buffer, now is ${typeof data}`);

		if (this.stage === RIPPLE_STAGE_EMPTY)
		{
			logger.info(`Ripple handleMessage, ripple has not begin, do not process messages`);

			return;
		}

		if(cmd >= 100 && cmd < 200)
		{
			this.amalgamate.handleMessage(address, cmd, data);
		}
		else if(cmd >= 200 && cmd < 300)
		{
			this.candidateAgreement.handleMessage(address, cmd, data);
		}
		else if(cmd >= 300 && cmd < 400)
		{
			this.blockAgreement.handleMessage(address, cmd, data);
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
	}
}



module.exports = Ripple;