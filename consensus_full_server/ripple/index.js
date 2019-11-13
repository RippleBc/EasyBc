const Amalgamate = require("./consensusStage/amalgamate");
const PrePrepare = require("./consensusStage/prePrepare");
const Prepare = require("./consensusStage/prepare");
const Commit = require("./consensusStage/commit");
const FetchConsensusCandidate = require("./consensusStage/fetchConsensusCandidate");
const ViewChangeForConsensusFail = require("./abnormalStage/viewChangeForConsensusFail");
const ViewChangeForTimeout = require("./abnormalStage/viewChangeForTimeout");
const FetchProcessState = require("./abnormalStage/fetchProcessState");
const NewView = require("./abnormalStage/newView");
const utils = require("../../depends/utils");
const { STAGE_STATE_EMPTY, 
	CHEAT_REASON_INVALID_PROTOCOL_CMD, 
	RIPPLE_STATE_EMPTY, 
	MAX_PROCESS_TRANSACTIONS_SIZE,
	RIPPLE_LEADER_EXPIRATION,

	STAGE_AMALGAMATE, 
	STAGE_PRE_PREPARE, 
	STAGE_PREPARE, 
	STAGE_COMMIT, 
	STAGE_FETCH_CANDIDATE, 
	STAGE_PROCESS_CONSENSUS_CANDIDATE,

	RIPPLE_STATE_CONSENSUS,
	RIPPLE_STATE_VIEW_CHANGE_FOR_CONSENSUS_FAIL,
	RIPPLE_STATE_NEW_VIEW,
	RIPPLE_STATE_FETCH_PROCESS_STATE,

	PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ,
	PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES,
	PROTOCOL_CMD_PRE_PREPARE_REQ,
	PROTOCOL_CMD_PRE_PREPARE_RES,
	PROTOCOL_CMD_PREPARE,
	PROTOCOL_CMD_COMMIT,
	PROTOCOL_CMD_CONSENSUS_CANDIDATE_REQ,
	PROTOCOL_CMD_CONSENSUS_CANDIDATE_RES,
	PROTOCOL_CMD_VIEW_CHANGE_FOR_CONSENSUS_FAIL,
	PROTOCOL_CMD_VIEW_CHANGE_FOR_TIMEOUT,
	PROTOCOL_CMD_NEW_VIEW_REQ,
	PROTOCOL_CMD_NEW_VIEW_RES,
	PROTOCOL_CMD_PROCESS_STATE_REQ,
	PROTOCOL_CMD_PROCESS_STATE_RES } = require("./constants");
const assert = require("assert");
const Block = require("../../depends/block");
const Update = require("./update");

const BN = utils.BN;
const rlp = utils.rlp;

const logger = process[Symbol.for("loggerConsensus")];
const mysql = process[Symbol.for("mysql")];
const unlManager = process[Symbol.for("unlManager")];

const WATER_LINE_STEP_LENGTH = 19901112;
const SYSTEM_LOOP_DELAY_TIME = 20;

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

		//
		this.amalgamate = new Amalgamate(this);
		this.prePrepare = new PrePrepare(this);
		this.prepare = new Prepare(this);
		this.commit = new Commit(this);
		this.fetchConsensusCandidate = new FetchConsensusCandidate(this);
		this.viewChangeForConsensusFail = new ViewChangeForConsensusFail(this);
		this.fetchProcessState = new FetchProcessState(this);
		this.viewChangeForTimeout = new ViewChangeForTimeout(this);
		this.newView = new NewView(this);

		//
		this.msgBuffer = new Map();

		//
		this.sequence = Buffer.alloc(0);
		this.hash = undefined;
		this.number = undefined;
		this.view = Buffer.alloc(0);

		// 
		this.lowWaterLine = new BN();

		//
		this.update = new Update();
	}

	get highWaterLine()
	{
		return new BN(this.lowWaterLine).addn(WATER_LINE_STEP_LENGTH);
	}

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage({ address, cmd, data }) {
		assert(Buffer.isBuffer(address), `Ripple handleMessage, address should be an Buffer, now is ${typeof address}`);
		assert(typeof cmd === 'number', `Ripple handleMessage, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(data), `Ripple handleMessage, data should be an Buffer, now is ${typeof data}`);

		switch (cmd) {
			case PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ:
			case PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES:
			case PROTOCOL_CMD_PRE_PREPARE_REQ:
			case PROTOCOL_CMD_PRE_PREPARE_RES:
			case PROTOCOL_CMD_PREPARE:
			case PROTOCOL_CMD_COMMIT:
			case PROTOCOL_CMD_CONSENSUS_CANDIDATE_REQ:
			case PROTOCOL_CMD_CONSENSUS_CANDIDATE_RES:
			case PROTOCOL_CMD_VIEW_CHANGE_FOR_CONSENSUS_FAIL:
				{
					//
					let msgsDifferByCmd = this.msgBuffer.get(cmd);
					const [sequence] = rlp.decode(data);

					//
					if (!msgsDifferByCmd)
					{
						msgsDifferByCmd = [];
					}	
					
					// update msg buffer
					msgsDifferByCmd.push({ sequence, address, data });
					this.msgBuffer.set(cmd, msgsDifferByCmd);
				}
				break;
			case PROTOCOL_CMD_VIEW_CHANGE_FOR_TIMEOUT:
				{
					if (this.hash === undefined || this.number === undefined) {
						return;
					}

					this.viewChangeForTimeout.handleMessage(address, cmd, data);

					return;
				}
			case PROTOCOL_CMD_NEW_VIEW_REQ:
			case PROTOCOL_CMD_NEW_VIEW_RES:
				{
					if (this.hash === undefined || this.number === undefined) {
						return;
					}

					this.newView.handleMessage(address, cmd, data);

					return;
				}
			case PROTOCOL_CMD_PROCESS_STATE_REQ:
			case PROTOCOL_CMD_PROCESS_STATE_RES:
				{
					if (this.hash === undefined || this.number === undefined) {
						return;
					}

					this.fetchProcessState.handleMessage(address, cmd, data);

					return;
				}
			default:
				{
					this.cheatedNodes.push({
						address: address.toString('hex'),
						reason: CHEAT_REASON_INVALID_PROTOCOL_CMD
					});

					return;
				}
		}
	}

	async run()
	{
		// fetch new txs
		({ transactions: this.localTransactions, deleteTransactions: this.deleteTransactions } = await mysql.getRawTransactions(MAX_PROCESS_TRANSACTIONS_SIZE));

		// sync block chain and process state
		await this.syncProcessState();
		
		//
		while(1)
		{
			if (this.state === RIPPLE_STATE_VIEW_CHANGE_FOR_CONSENSUS_FAIL) {
				const msg = this.fetchMsg(PROTOCOL_CMD_VIEW_CHANGE_FOR_CONSENSUS_FAIL);

				if (msg) {
					this.viewChangeForConsensusFail.handleMessage(msg.address, msg.cmd, msg.data);
				}
				else
				{
					await new Promise(resolve => {
						setTimeout(() => {
							resolve();
						}, SYSTEM_LOOP_DELAY_TIME);
					});
				}
			}
			else if (this.state === RIPPLE_STATE_CONSENSUS) {
				switch (this.stage) {
					case STAGE_AMALGAMATE:
						{
							const msg1 = this.fetchMsg(PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ);
							if(msg1)
							{
								this.amalgamate.handleMessage(msg1.address, msg1.cmd, msg1.data);
							}

							const msg2 = this.fetchMsg(PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES);
							if (msg2) {
								this.amalgamate.handleMessage(msg2.address, msg2.cmd, msg2.data);
							}
							
							//
							if (!msg1 && !msg2) {
								await new Promise(resolve => {
									setTimeout(() => {
										resolve();
									}, SYSTEM_LOOP_DELAY_TIME);
								});
							}
						}
					case STAGE_PRE_PREPARE:
						{
							const msg1 = this.fetchMsg(PROTOCOL_CMD_PRE_PREPARE_REQ);
							if (msg1) {
								this.prePrepare.handleMessage(msg1.address, msg1.cmd, msg1.data);
							}

							const msg2 = this.fetchMsg(PROTOCOL_CMD_PRE_PREPARE_RES);
							if (msg2) {
								this.prePrepare.handleMessage(msg2.address, msg2.cmd, msg2.data);
							}

							//
							if (!msg1 && !msg2) {
								await new Promise(resolve => {
									setTimeout(() => {
										resolve();
									}, SYSTEM_LOOP_DELAY_TIME);
								});
							}
						}
					case STAGE_PREPARE:
						{
							const msg = this.fetchMsg(PROTOCOL_CMD_PREPARE);
							if (msg) {
								this.prepare.handleMessage(msg.address, msg.cmd, msg.data);
							}
							else
							{
								await new Promise(resolve => {
									setTimeout(() => {
										resolve();
									}, SYSTEM_LOOP_DELAY_TIME);
								});
							}
						}
					case STAGE_COMMIT:
						{
							const msg = this.fetchMsg(PROTOCOL_CMD_COMMIT);
							if (msg) {
								this.commit.handleMessage(msg.address, msg.cmd, msg.data);
							}
							else {
								await new Promise(resolve => {
									setTimeout(() => {
										resolve();
									}, SYSTEM_LOOP_DELAY_TIME);
								});
							}
						}
					case STAGE_FETCH_CANDIDATE:
						{
							const msg1 = this.fetchMsg(PROTOCOL_CMD_CONSENSUS_CANDIDATE_REQ);
							if (msg1) {
								this.fetchConsensusCandidate.handleMessage(msg1.address, msg1.cmd, msg1.data);
							}

							const msg2 = this.fetchMsg(PROTOCOL_CMD_CONSENSUS_CANDIDATE_RES);
							if (msg2) {
								this.fetchConsensusCandidate.handleMessage(msg2.address, msg2.cmd, msg2.data);
							}

							//
							if (!msg1 && !msg2) {
								await new Promise(resolve => {
									setTimeout(() => {
										resolve();
									}, SYSTEM_LOOP_DELAY_TIME);
								});
							}
						}
					case STAGE_PROCESS_CONSENSUS_CANDIDATE:
						{
							await new Promise(resolve => {
								setTimeout(() => {
									resolve();
								}, SYSTEM_LOOP_DELAY_TIME);
							});
						}
						break;
				}
			}
			else
			{
				await new Promise(resolve => {
					setTimeout(() => {
						resolve();
					}, SYSTEM_LOOP_DELAY_TIME);
				});
			}
		}
	}

	/**
	 * 
	 */
	runNewConsensusRound()
	{
		//
		this.amalgamatedTransactions.clear();
		this.candidate = undefined;
		this.candidateDigest = undefined;
		this.consensusCandidateDigest = undefined;

		//
		this.amalgamate.reset();
		this.prePrepare.reset();
		this.prepare.reset();
		this.commit.reset();
		this.fetchConsensusCandidate.reset();
		this.viewChangeForConsensusFail.reset();

		//
		this.clearLeaderTimer();

		//
		this.state = RIPPLE_STATE_CONSENSUS;

		//
		this.amalgamate.run();
	}

	async syncProcessState()
	{
		// update block chain
		await this.update.run();

		// init number
		this.number = await this.update.blockChain.getBlockChainHeight(); 

		// init hash
		this.hash = await this.update.blockChain.getBlockHashByNumber(this.number);

		// update process state
		this.fetchProcessState.run();
	}

	/**
	 * 
	 */
	processConsensusCandidate()
	{
		const consensusBlock = new Block({
			header: {
				number: this.candidate.number,
				parentHash: this.candidate.blockHash,
				timestamp: this.candidate.timestamp
			},
			transactions: this.candidate.transactions
		});

		this.state = STAGE_PROCESS_CONSENSUS_CANDIDATE;

		(async () => {

			// update hash and number
			this.hash = consensusBlock.hash();
			this.number = consensusBlock.header.number;

			// process block
			await this.processor.processBlock({
				block: consensusBlock
			});

			//
			await this.deleteTransactions();

			// fetch new txs
			({ transactions: this.localTransactions, deleteTransactions: this.deleteTransactions} = await mysql.getRawTransactions(MAX_PROCESS_TRANSACTIONS_SIZE));

			// notice view may have been changed
			this.runNewConsensusRound();
		})().catch(e => {
			logger.fatal(`Ripple processConsensusCandidate, throw exception, ${process[Symbol.for("getStackInfo")](e)}`);

			process.exit(1);
		});
	}

	startLeaderTimer()
	{
		this.leaderTimeout = setTimeout(() => {
			// try to view change
			this.viewChangeForTimeout.run();

			// try to sync state
			this.syncProcessState();
		}, RIPPLE_LEADER_EXPIRATION);
	}

	clearLeaderTimer()
	{
		if (this.leaderTimeout)
		{
			this.leaderTimeout.clear();
		}
		
		this.leaderTimeout = undefined;
	}

	/**
	 * 
	 * @param {String} address 
	 */
	checkLeader(address)
	{
		assert(typeof address === 'string', `Ripple checkLeader, address should be a String, now is ${typeof address}`);

		let leaderIndex = new BN(this.view).modn(unlManager.unlFullSize);
		for (let node of unlManager.unlIncludeSelf) {
			if (node.index === leaderIndex && node.address === address) {
				return true;
			}
		}

		return false;
	}

	/**
	 * @return {Buffer} address
	 */
	get nextViewLeaderAddress()
	{
		let nextViewLeaderIndex = new BN(this.view).addn(1).modn(unlManager.unlFullSize);
		for (let node of unlManager.unlIncludeSelf)
		{
			logger.info(`Ripple nextViewLeaderAddress, index: ${node.index}, address: ${node.address}`);

			if (node.index === nextViewLeaderIndex)
			{
				return Buffer.from(node.address, 'hex');
			}
		}

		logger.fatal(`Ripple nextViewLeaderAddress, nextViewLeaderIndex: ${nextViewLeaderIndex}, not exist, ${process[Symbol.for("getStackInfo")]()}`);
		
		process.exit(1);
	}

	get threshould() 
	{
		return parseInt(unlManager.unlFullSize * 2 / 3 + 1);
	}

	/**
	 * @param {Number} cmd 
	 * @return {Object} 
	 */
	fetchMsg(cmd)
	{
		assert(typeof cmd === 'number', `Ripple fetchMsg, cmd should be a Number, now is ${typeof cmd}`);

		const msgsDifferByCmd = this.msgBuffer.get(cmd) || [];

		//
		let correspondMsg = undefined;
		
		// delete expired msgs
		const filteredMsgs = [];
		for (let msg of msgsDifferByCmd)
		{
			if(new BN(msg.sequence).lt(new BN(this.sequence)))
			{
				continue;
			}

			if (msg.sequence.toString('hex') === this.sequence.toString('hex'))
			{
				correspondMsg = { 
					address: msg.address, 
					cmd: cmd,
					data: msg.data
				};

				break;
			}

			filteredMsgs.push(msg);
		}

		// update msg buffer
		this.msgBuffer.set(cmd, filteredMsgs);

		//
		// if (correspondMsg)
		// {
		// 	logger.info(`Ripple fetchMsg, address: ${correspondMsg.address.toString('hex')}, cmd: ${correspondMsg.cmd}`);
		// }
		// else
		// {
		// 	logger.info(`Ripple fetchMsg, msg with cmd ${cmd} not exist`);
		// }
		return correspondMsg;
	}

	/**
	 * @param {Array} cheatedNodes
	 */
	handleCheatedNodes(cheatedNodes) {
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