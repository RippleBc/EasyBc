const Amalgamate = require("./consensusStage/amalgamate");
const PrePrepare = require("./consensusStage/prePrepare");
const Prepare = require("./consensusStage/prepare");
const Commit = require("./consensusStage/commit");
const FetchConsensusCandidate = require("./fetchConsensusCandidate");
const ViewChange = require("./viewChange");

const { STAGE_STATE_EMPTY, CHEAT_REASON_INVALID_PROTOCOL_CMD, RIPPLE_STAGE_EMPTY, MAX_PROCESS_TRANSACTIONS_SIZE } = require("../constant");
const assert = require("assert");
const Block = require("../../depends/block");

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const mysql = process[Symbol.for("mysql")];
const unlManager = process[Symbol.for("unlManager")]
const privateKey = process[Symbol.for("privateKey")];

class Ripple
{
	constructor(processor)
	{
		this.processor = processor;

		this.stage = RIPPLE_STAGE_EMPTY;
		
		// 
		this.localTransactions = [];
		this.amalgamatedTransactions = new Set();
		this.candidate = undefined;
		this.candidateDigest = undefined;
		this.consensusCandidateDigest = undefined;

		this.amalgamate = new Amalgamate(this);
		this.prePrepare = new PrePrepare(this);
		this.prepare = new Prepare(this);
		this.commit = new Commit(this);
		this.fetchConsensusCandidate = new FetchConsensusCandidate(this);
		this.viewChange = new ViewChange(this);
	}

	/**
	 *
	 */
	run()
	{	
		this.amalgamate.run();
	}

	/**
	 * 
	 */
	processConsensusCandidate()
	{
		const consensusBlock = new Block({
			header: {
				number: this.candidate.number,
				parentHash: this.candidate.parentHash,
				timestamp: this.candidate.timestamp
			},
			transactions: this.candidate.transactions
		});

		this.processor.processBlock({
			block: consensusBlock
		}).then(() => {

		});
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
				
				process.exit(1);
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
		this.stage = RIPPLE_STAGE_EMPTY;

		// 
		this.localTransactions = [];
		this.amalgamatedTransactions.clear();
		this.candidate = undefined;
		this.candidateDigest = undefined;
		this.consensusCandidateDigest = undefined;

		this.amalgamate.reset();
		this.prePrepare.reset();
		this.prepare.reset();
		this.commit.reset();
		this.fetchConsensusCandidate.reset();
		this.viewChange.reset();
	}
}



module.exports = Ripple;