const Amalgamate = require("./stage/amalgamate");
const CandidateAgreement = require("./stage/candidateAgreement");
const BlockAgreement = require("./stage/blockAgreement");
const { MAX_PROCESS_TRANSACTIONS_SIZE, STATE_EMPTY, STATE_SUCCESS_FINISH, STATE_TIMEOUT_FINISH, INVALID_STAGE_RETRY_TIME } = require("../constant");
const assert = require("assert");

const p2p = process[Symbol.for("p2p")];

const logger = process[Symbol.for("loggerConsensus")];

const PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE = 500;
const PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE = 501;
const PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE = 502;

class Ripple
{
	constructor(processor)
	{
		this.processor = processor;

		this.round = 0;
		this.stage = 0;

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
			switch(cmd)
			{
				case PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE:
				{
					const self = this;
					setTimeout(() => {
						logger.error("amalgamate stage is invalid, waiting for amalgamate stage");

						// self.run(true);
					}, INVALID_STAGE_RETRY_TIME)
				}
				break;
				case PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE:
				{
					logger.error("candidate agreement stage is invalid, jump to amalgamate stage");

					// this.reset();
					// this.run();
				}
				break;
				case PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE:
				{
					logger.error("block agreement stage is invalid, jump to amalgamate stage");

					// this.reset();
					// this.run();
				}
				break;
			}
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