const Amalgamate = require("./stage/amalgamate");
const CandidateAgreement = require("./stage/candidateAgreement");
const BlockAgreement = require("./stage/blockAgreement");
const { STAGE_MAX_FINISH_RETRY_TIMES, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE, RIPPLE_STATE_STAGE_CONSENSUS, RIPPLE_STATE_TRANSACTIONS_CONSENSUS, MAX_PROCESS_TRANSACTIONS_SIZE, RIPPLE_STAGE_AMALGAMATE, RIPPLE_STAGE_CANDIDATE_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT, RIPPLE_MAX_ROUND } = require("../constant");
const assert = require("assert");
const Counter = require("./stage/counter");
const Perish = require("./perish");
const utils = require("../../depends/utils");
const AsyncEventemitter = require("async-eventemitter");

const bufferToInt = utils.bufferToInt;
const rlp = utils.rlp;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const mysql = process[Symbol.for("mysql")];

class Ripple extends AsyncEventemitter
{
	constructor(processor)
	{
		super();

		this.processor = processor;
		
		//
		this.killedNodes = new Set();

		this.state = RIPPLE_STATE_TRANSACTIONS_CONSENSUS;

		this.round = 0;
		this.stage = 0;


		this.counter = new Counter(this);
		this.perish = new Perish(this);
		this.amalgamate = new Amalgamate(this);
		this.candidateAgreement = new CandidateAgreement(this);
		this.blockAgreement = new BlockAgreement(this);

		//
		this.processingTransactions = [];

		// used for cache amalgamate message
		this.amalgamateMessagesCache = [];

		const self = this;
		this.on("blockProcessOver", () => {
			for(let i = 0; i < self.amalgamateMessagesCache.length; i++)
			{
				let {address, cmd, data} = self.amalgamateMessagesCache[i];
				self.amalgamate.handleMessage(address, cmd, data);
			}

			self.amalgamateMessagesCache = [];
		});
	}

	/*
	 * @param {Boolean} ifRetry
	 */
	run(ifRetry = false)
	{
		if(!ifRetry)
		{
			this.processor.getTransactions(MAX_PROCESS_TRANSACTIONS_SIZE).then(transactions => {
				this.processingTransactions = transactions;

				this.round += 1;
				if(this.round > RIPPLE_MAX_ROUND)
				{
					this.round = 0;
				}

				this.amalgamate.run(this.processingTransactions);
				this.state = RIPPLE_STATE_TRANSACTIONS_CONSENSUS;
			}).catch(e => {
				logger.fatal(`Ripple run, throw exceptions, ${e.stack}`);
				process.exit(1)
			})

			return;
		}
		
		this.round += 1;
		if(this.round > RIPPLE_MAX_ROUND)
		{
			this.round = 0;
		}

		this.amalgamate.run(this.processingTransactions);
		this.state = RIPPLE_STATE_TRANSACTIONS_CONSENSUS;
	}

	/**
	 * @param {Buffer} address
	 */
	recordKilledNode(address)
	{
		assert(Buffer.isBuffer(address), `Ripple recordKilledNode, address should be an Buffer, now is ${typeof address}`);

		this.killedNodes.add(address.toString("hex"));
	}

	/**
	 * @param {Buffer} address
	 * @return {Boolean}
	 */
	checkIfNodeIsKilled(address)
	{
		assert(Buffer.isBuffer(address), `Ripple checkIfNodeIsKilled, address should be an Buffer, now is ${typeof address}`);

		return this.killedNodes.has(address.toString("hex"));
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

	handleCounter()
	{
		this.reset();
		this.run(true);
		this.counter.reset();
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
			if(this.state === RIPPLE_STATE_STAGE_CONSENSUS && this.counter.checkIfDataExchangeIsFinish())
			{
				this.reset();
				this.run(true);
				this.counter.reset();
				this.amalgamate.handleMessage(address, cmd, data);
			}
			else
			{
				return logger.info(`Ripple handleMessage, processor is synchronizing stage, do not handle transaction consensus messages`);
			}

			if(this.blockAgreement.checkIfDataExchangeIsFinish())
			{
				this.blockAgreement.handler();
				this.blockAgreement.reset();
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
				p2p.send(address, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE);
			}
		}
		else if(cmd >= 200 && cmd < 300)
		{
			if(this.state === RIPPLE_STATE_STAGE_CONSENSUS)
			{
				return logger.info(`Ripple handleMessage, processor is synchronizing stage, do not handle transaction consensus messages`);
			}

			if(this.amalgamate.checkIfDataExchangeIsFinish())
			{
				this.amalgamate.handler();
				this.amalgamate.reset();
			}

			if(this.candidateAgreement.checkDataExchangeIsProceeding() || this.candidateAgreement.checkIfDataExchangeIsFinish())
			{
				this.candidateAgreement.handleMessage(address, cmd, data);
			}
			else
			{
				p2p.send(address, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE);
			}
		}
		else if(cmd >= 300 && cmd < 400)
		{
			if(this.state === RIPPLE_STATE_STAGE_CONSENSUS)
			{
				return logger.info(`Ripple handleMessage, processor is synchronizing stage, do not handle transaction consensus messages`);
			}

			if(this.candidateAgreement.checkIfDataExchangeIsFinish())
			{
				this.candidateAgreement.handler();
				this.candidateAgreement.reset();
			}
			
			if(this.blockAgreement.checkDataExchangeIsProceeding() || this.blockAgreement.checkIfDataExchangeIsFinish())
			{
				this.blockAgreement.handleMessage(address, cmd, data);
			}
			else
			{
				p2p.send(address, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE);
			}
		}
		else if(cmd >= 400 && cmd < 500)
		{
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

		this.round = 0;
		this.stage = 0;
	}
}



module.exports = Ripple;