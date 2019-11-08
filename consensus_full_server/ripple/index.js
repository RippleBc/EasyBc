const Amalgamate = require("./consensusStage/amalgamate");
const PrePrepare = require("./consensusStage/prePrepare");
const Prepare = require("./consensusStage/prepare");
const Commit = require("./consensusStage/commit");
const FetchConsensusCandidate = require("./fetchConsensusCandidate");
const ViewChangeForConsensusFail = require("./abnormalStage/viewChangeForConsensusFail");
const ViewChangeForTimeout = require("./abnormalStage/viewChangeForTimeout");
const NewView = require("./abnormalStage/NewView");

const { STAGE_STATE_EMPTY, 
	CHEAT_REASON_INVALID_PROTOCOL_CMD, 
	RIPPLE_STATE_EMPTY, 
	MAX_PROCESS_TRANSACTIONS_SIZE,
	RIPPLE_LEADER_EXPIRATION,
	RIPPLE_STAGE_PROCESS_CONSENSUS_CANDIDATE,
	RIPPLE_STATE_SYNC_NODE_STATE } = require("./constants");
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

		this.state = RIPPLE_STATE_EMPTY;
		
		// 
		this.localTransactions = [];
		this.amalgamatedTransactions = new Set();
		this.candidate = undefined;
		this.candidateDigest = undefined;
		this.consensusCandidateDigest = undefined;
		this.consensusViewChange = undefined;

		this.amalgamate = new Amalgamate(this);
		this.prePrepare = new PrePrepare(this);
		this.prepare = new Prepare(this);
		this.commit = new Commit(this);
		this.fetchConsensusCandidate = new FetchConsensusCandidate(this);
		this.viewChangeForConsensusFail = new ViewChangeForConsensusFail(this);
		this.viewChangeForTimeout = new ViewChangeForTimeout(this);
		this.newView = new NewView(this);
	}

	/**
	 *
	 */
	run()
	{	
		await mysql.getRawTransactions(MAX_PROCESS_TRANSACTIONS_SIZE);

		this.localTransactions = [];
		this.amalgamatedTransactions.clear();
		this.candidate = undefined;
		this.candidateDigest = undefined;
		this.consensusCandidateDigest = undefined;
		this.consensusViewChange = undefined;

		this.amalgamate.reset();
		this.prePrepare.reset();
		this.prepare.reset();
		this.commit.reset();
		this.fetchConsensusCandidate.reset();

		this.state = RIPPLE_STATE_CONSENSUS;

		this.amalgamate.run();
	}

	syncNodeState()
	{
		this.state = RIPPLE_STATE_SYNC_NODE_STATE;

		// 
		process.exit(1);
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

		this.state = RIPPLE_STAGE_PROCESS_CONSENSUS_CANDIDATE;

		(async () => {

			// update hash and number
			this.ripple.hash = consensusBlock.hash();
			this.ripple.number = consensusBlock.header.number;

			// process block
			await this.processor.processBlock({
				block: consensusBlock
			});

			// notice view may have been changed
			this.ripple.run();
		});
	}

	startLeaderTimer()
	{
		this.leaderTimeout = setTimeout(() => {
			// try to view change
			this.viewChangeForTimeout.run();

			// try to
			this.syncNodeState();
		}, RIPPLE_LEADER_EXPIRATION);
	}

	clearLeaderTimer()
	{
		this.leaderTimeout.clear();

		this.leaderTimeout = undefined;
	}

	/**
	 * 
	 * @param {String} address 
	 */
	checkLeader(address)
	{
		assert(typeof address === 'string', `Ripple checkLeader, address should be a String, now is ${typeof address}`);

		let nextViewLeaderIndex = new BN(this.ripple.view).modrn(unlManager.fullUnl.length);
		for (let node of unlManager.fullUnl) {
			if (node.index === nextViewLeaderIndex) {
				return node.address;
			}
		}
	}

	get nextViewLeaderAddress()
	{
		let nextViewLeaderIndex = new BN(this.ripple.view).addn(1).modrn(unlManager.fullUnl.length);
		for (let node of unlManager.fullUnl)
		{
			if (node.index === nextViewLeaderIndex)
			{
				return node.address;
			}
		}
	}

	get threshould() 
	{
		return unlManager.fullUnl.length * 2 / 3 + 1;
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

	handleMessage()
	{	
		const msg = this.processor.getMessage();
		
		// check get specified msg
	}

	/**
 * @param {Buffer} address
 * @return {Boolean}
 */
	perishNode(address) {
		if (this.perish.state !== STAGE_STATE_EMPTY) {
			return false;
		}
		else {
			this.perish.startPerishNodeSpreadMode({
				address: address
			});

			return true;
		}
	}

	/**
	 * @param {Array/String} address
	 */
	async pardonNodes(addresses) {
		assert(Array.isArray(addresses), `Ripple pardonNodes, addresses should be an Array, now is ${typeof addresses}`)

		await unlManager.setNodesRighteous(addresses)
	}

	/**
	 * @param {Array} nodes 
	 */
	async addNodes(nodes) {
		assert(Array.isArray(nodes), `Ripple addNodes, nodes should be an Array, now is ${typeof nodes}`)

		await unlManager.addNodes(nodes);
	}

	/**
	 * @param {Array} nodes 
	 */
	async updateNodes(nodes) {
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
}



module.exports = Ripple;