const Amalgamate = require("./stage/amalgamate");
const CandidateAgreement = require("./stage/candidateAgreement");
const BlockAgreement = require("./stage/prepare");
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
		
		// used for cache transactions
		this.localTransactions = [];

		// 
		this.amalgamatedTransactions = new Set();

		// 
		this.candidate = undefined;

		//
		this.candidateDigest = undefined;

		//
		this.consensusCandidateDigest = undefined;
	}

	/**
	 *
	 */
	run()
	{	
		this.amalgamate.run();
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