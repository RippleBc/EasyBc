const Amalgamate = require("./stage/amalgamate");
const CandidateAgreement = require("./stage/candidateAgreement");
const BlockAgreement = require("./stage/blockAgreement");
const { MAX_PROCESS_TRANSACTIONS_SIZE, STAGE_AMALGAMATE, STAGE_CANDIDATE_AGREEMENT, STAGE_BLOCK_AGREEMENT } = require("../constant");
const assert = require("assert");

const p2p = process[Symbol.for("p2p")];

const logger = process[Symbol.for("loggerConsensus")];

const RIPPLE_STATE_IDLE = 0;
const RIPPLE_STATE_STAGE_CONSENSUS = 1;
const RIPPLE_STATE_TRANSACTIONS_CONSENSUS = 2;

class Ripple
{
	constructor(processor)
	{
		this.processor = processor;

		this.state = RIPPLE_STATE_IDLE;

		this.round = 0;
		this.stage = 0;
		this.pursueTime = 0;

		this.amalgamate = new Amalgamate(this);
		this.candidateAgreement = new CandidateAgreement(this);
		this.blockAgreement = new BlockAgreement(this);

		this.processingTransactions = [];
	}

	/*
	 * @param {Boolean} ifRetry
	 */
	run(ifRetry = false)
	{
		if(!ifRetry)
		{
			this.processingTransactions = this.processor.getTransactions(MAX_PROCESS_TRANSACTIONS_SIZE);
		}
		
		this.round += 1;
		this.stage = 0;

		this.amalgamate.run(this.processingTransactions);
		this.state = RIPPLE_STATE_TRANSACTIONS_CONSENSUS;
	}

	/**
	 * @param {Buffer} round
	 * @param {Buffer} stage
	 * @param {Buffer} primaryConsensusTime
	 * @param {Buffer} finishConsensusTime
	 * @param {Buffer} pastTime
	 */
	handleCounter(round, stage, primaryConsensusTime, finishConsensusTime, pastTime)
	{
		if(this.round >= round)
		{
			logger.info("************************************ I'm fast ************************************");

			return;
		}

		this.state = RIPPLE_STATE_STAGE_CONSENSUS;

		this.reset();

		this.round = round;

		// compute new round and stage
		const self = this;
		const delayTime = primaryConsensusTime +  finishConsensusTime - pastTime + pursueTime;
		if(stage === STAGE_AMALGAMATE)
		{
			setTimeout(() => {
				self.candidateAgreement.run([]);
				this.state = RIPPLE_STATE_TRANSACTIONS_CONSENSUS;
			}, delayTime);
		}
		else if(stage === STAGE_CANDIDATE_AGREEMENT)
		{
			setTimeout(() => {
				self.blockAgreement.run([]);
				this.state = RIPPLE_STATE_TRANSACTIONS_CONSENSUS;
			}, delayTime);
		}
		else
		{
			setTimeout(() => {
				self.run();
			}, delayTime);
		}
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

		if(this.state !== RIPPLE_STATE_TRANSACTIONS_CONSENSUS)
		{
			return;
		}

		if(cmd >= 100 && cmd < 200)
		{
			if(this.blockAgreement.checkFinishState())
			{
				this.blockAgreement.handler();
				this.blockAgreement.reset();
			}
			
			if(this.amalgamate.checkProcessingState() || this.amalgamate.checkFinishState())
			{
				this.amalgamate.handleMessage(address, cmd, data);
			}
			else
			{
				logger.error(`Ripple handleMessage, address ${address.toString("hex")} is not consensus, block agreement stage is not over`);

				p2p.send(address, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE);
			}
		}
		else if(cmd >= 200 && cmd < 300)
		{
			if(this.amalgamate.checkFinishState())
			{
				this.amalgamate.handler();
				this.amalgamate.reset();
			}

			if(this.candidateAgreement.checkProcessingState() || this.candidateAgreement.checkFinishState())
			{
				this.candidateAgreement.handleMessage(address, cmd, data);
			}
			else
			{
				logger.error(`Ripple handleMessage, address ${address.toString("hex")} is not consensus, amalgamate stage is not over`);

				p2p.send(address, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE);
			}
		}
		else if(cmd >= 300 && cmd < 400)
		{
			this.counter.handleMessage(address, cmd, data);
		}
		else if(cmd >= 400 && cmd < 500)
		{
			if(this.candidateAgreement.checkFinishState())
			{
				this.candidateAgreement.handler();
				this.candidateAgreement.reset();
			}
			
			if(this.blockAgreement.checkProcessingState() || this.blockAgreement.checkFinishState())
			{
				this.blockAgreement.handleMessage(address, cmd, data);
			}
			else
			{
				logger.error(`Ripple handleMessage, address ${address.toString("hex")} is not consensus, candidate agreement stage is not over`);

				p2p.send(address, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE);
			}
		}
		else
		{
			
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