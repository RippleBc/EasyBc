const Amalgamate = require("./stage/amalgamate");
const CandidateAgreement = require("./stage/candidateAgreement");
const BlockAgreement = require("./stage/blockAgreement");

const logger = process[Symbol.for("loggerConsensus")];

const MAX_PROCESS_TRANSACTIONS_SIZE = 100;

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
			this.amalgamate.handleMessage(address, cmd, data);
		}
		else if(cmd >= 200 && cmd < 300)
		{
			this.candidateAgreement.handleMessage(address, cmd, data);
		}
		else if(cmd >= 300 && cmd < 400)
		{
			this.timeAgreement.handleMessage(address, cmd, data);
		}
		else if(cmd >= 400 && cmd < 500)
		{
			this.blockAgreement.handleMessage(address, cmd, data);
		}
		else
		{
			logger.error(`Ripple handleMessage, invalid cmd, ${cmd}`);
		}
	}
}

module.exports = Ripple;