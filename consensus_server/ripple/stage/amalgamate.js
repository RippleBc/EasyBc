const Candidate = require("../data/candidate");
const utils = require("../../../depends/utils");
const Stage = require("./stage");
const process = require("process");
const assert = require("assert");

const rlp = utils.rlp;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

const PROTOCOL_CMD_CANDIDATE_AMALGAMATE = 100;
const PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_REQUEST = 101;
const PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_RESPONSE = 102;

class Amalgamate extends Stage
{
	constructor(ripple)
	{
		super({
			finish_state_request_cmd: PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_REQUEST,
			finish_state_response_cmd: PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_RESPONSE
		});

		this.ripple = ripple;
		this.candidates = [];
	}

	handler()
	{
		const transactions = new Set();
		this.candidates.forEach(candidate => {
			const rawTransactions = rlp.decode(candidate.transactions);

			rawTransactions.forEach(rawTransaction => {
				transactions.add(rawTransaction);
			})
		});

		this.ripple.candidateAgreement.run([...transactions]);
	}

	/**
	 * @param {Array} transactions
	 */
	run(transactions)
	{
		assert(Array.isArray(transactions), `Amalgamate run, transactions should be an Array, now is ${typeof transactions}`);

		logger.warn("amalgamate begin, transactions: ");
		for(let i = 0; i < transactions; i++)
		{
			let transaction = new Transaction(`0x${transactions[i]}`)
			logger.warn(`hash: ${transaction.hash.toString("hex")}, from: ${transaction.from.toString("hex")}, to: ${transaction.to.toString("hex")}, value: ${transaction.value.toString("hex")}, nonce: ${transaction.nonce.toString("hex")}`);
		}

		this.init();
		
		// init candidate
		const candidate = new Candidate({
			transactions: rlp.encode(transactions)
		});
		candidate.sign(privateKey);

		// broadcast candidate
		p2p.sendAll(PROTOCOL_CMD_CANDIDATE_AMALGAMATE, candidate.serialize());

		//
		this.candidates.push(candidate);
	}

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage(address, cmd, data)
	{
		assert(Buffer.isBuffer(address), `Amalgamate handleMessage, address should be an Buffer, now is ${typeof address}`);
		assert(typeof cmd === "number", `Amalgamate handleMessage, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(data), `Amalgamate handleMessage, data should be an Buffer, now is ${typeof data}`);

		switch(cmd)
		{
			case PROTOCOL_CMD_CANDIDATE_AMALGAMATE:
			{
				this.handleAmalgamate(data);
			}
			break;
			default:
			{
				super.handleMessage(address, cmd, data);
			}
		}
	}

	/**
	 * @param {Buffer} address
	 * @param {Buffer} data
	 */
	handleAmalgamate(address, data)
	{
		assert(Buffer.isBuffer(address), `Amalgamate handleAmalgamate, address should be an Buffer, now is ${typeof address}`);
		assert(Buffer.isBuffer(data), `Amalgamate handleAmalgamate, data should be an Buffer, now is ${typeof data}`);

		const candidate = new Candidate(data);

		if(candidate.validate())
		{
			if(address.toString("hex") !== candidate.from.toString("hex"))
			{
				logger.error(`Amalgamate handleAmalgamate, address is invalid, address should be ${address.toString("hex")}, now is ${candidate.from.toString("hex")}`);
			}
			else
			{
				this.candidates.push(candidate);
			}
		}
		else
		{
			logger.error(`Amalgamate handleAmalgamate, address ${address.toString("hex")}, send an invalid message`);
		}

		this.recordFinishNode(address.toString("hex"));
	}

	reset()
	{
		super.innerReset();
		this.candidates = [];
	}
}

module.exports = Amalgamate;