const Amalgamate = require("./stage/amalgamate");
const CandidateAgreement = require("./stage/candidateAgreement");
const BlockAgreement = require("./stage/blockAgreement");
const { MAX_PROCESS_TRANSACTIONS_SIZE, STATE_EMPTY, STATE_SUCCESS_FINISH, STATE_TIMEOUT_FINISH } = require("../constant");

const p2p = process[Symbol.for("p2p")];

const logger = process[Symbol.for("loggerConsensus")];

const PROTOCOL_CMD_INVALID_STAGE = 500;

class Ripple
{
	constructor(processor)
	{
		this.processor = processor;

		this.amalgamate = new Amalgamate(this);
		this.candidateAgreement = new CandidateAgreement(this);
		this.blockAgreement = new BlockAgreement(this);
	}

	run()
	{
		const transactions = this.processor.getTransactions(MAX_PROCESS_TRANSACTIONS_SIZE)
		this.amalgamate.run(transactions);
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
				this.blockAgreement.reset();
				this.blockAgreement.handler();
				this.amalgamate.handleMessage(address, cmd, data);
			}
			else if(this.amalgamate.checkProcessingState() || this.amalgamate.checkFinishState())
			{
				this.amalgamate.handleMessage(address, cmd, data);
			}
			else
			{
				logger.warn(`Ripple handleMessage, address ${address.toString("hex")} is too quick, block agreement stage is not over`);

				p2p.send(address, PROTOCOL_CMD_INVALID_STAGE);
			}
		}
		else if(cmd >= 200 && cmd < 300)
		{
			if(this.amalgamate.checkFinishState())
			{
				this.amalgamate.reset();
				this.amalgamate.handler();
				this.candidateAgreement.handleMessage(address, cmd, data);
			}
			else if(this.candidateAgreement.checkProcessingState() || this.candidateAgreement.checkFinishState())
			{
				this.candidateAgreement.handleMessage(address, cmd, data);
			}
			else
			{
				logger.warn(`Ripple handleMessage, address ${address.toString("hex")} is too quick, amalgamate stage is not over`);
			}
		}
		else if(cmd >= 400 && cmd < 500)
		{
			if(this.candidateAgreement.checkFinishState())
			{
				this.candidateAgreement.reset();
				this.candidateAgreement.handler();
				this.blockAgreement.handleMessage(address, cmd, data);
			}
			else if(this.blockAgreement.checkProcessingState() || this.blockAgreement.checkFinishState())
			{
				this.blockAgreement.handleMessage(address, cmd, data);
			}
			else
			{
				logger.warn(`Ripple handleMessage, address ${address.toString("hex")} is too quick, candidate agreement stage is not over`);
			}
		}
		else
		{
			if(cmd === PROTOCOL_CMD_INVALID_STAGE)
			{
				setTimeout(() => {
					
				}, 1000)
			}
		}
	}
}

module.exports = Ripple;