const Candidate = require("../data/candidate");
const utils = require("../../../depends/utils");
const Stage = require("./stage");
const process = require("process");
const { unl } = require("../../config.json");

const sha256 = utils.sha256;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

const PROTOCOL_CMD_CANDIDATE_AGREEMENT = 200;
const PROTOCOL_CMD_CANDIDATE_AGREEMENT_FINISH_STATE_REQUEST = 201;
const PROTOCOL_CMD_CANDIDATE_AGREEMENT_FINISH_STATE_RESPONSE = 202;
const THRESHOULD = 0.8;

class CandidateAgreement extends Stage
{
	constructor(ripple)
	{
		super({
			finish_state_request_cmd: PROTOCOL_CMD_CANDIDATE_AGREEMENT_FINISH_STATE_REQUEST,
			finish_state_response_cmd: PROTOCOL_CMD_CANDIDATE_AGREEMENT_FINISH_STATE_RESPONSE,
			handler: this.handler
		});

		this.ripple = ripple;
		this.candidates = [];
	}

	handler()
	{
		const transactions = new Hash();
		this.candidates.forEach(candidate => {
			const key = sha256(candidate.transactions);

			if(transactions.has(key))
			{
				transactions[key].count += 1;
			}
			else
			{
				transactions[key] = {
					count: 1,
					data: candidate.transactions
				};
			}
		});

		const primaryTransactions = [...transactions].sort(transaction => {
			return -transaction[1].count;
		});

		if(primaryTransactions[0] && primaryTransactions[0][1].count / unl.length >= THRESHOULD)
		{
			this.ripple.blockAgreement.run(primaryTransactions[0][1].data);
		}
		else
		{
			this.ripple.amalgamate.reset();
			this.ripple.amalgamate.run(rlp.decode(primaryTransactions[0][1].data));
		}
	}

	/**
	 * @param {Array} transactions
	 */
	run(transactions)
	{
		assert(Array.isArray(transactions), `CandidateAgreement run, transactions should be an Array, now is ${typeof transactions}`);

		// init candidate
		const candidate = new Candidate({
			transactions: rlp.encode(transactions)
		});
		candidate.sign(privateKey);

		// broadcast candidate
		p2p.sendAll(PROTOCOL_CMD_CANDIDATE_AGREEMENT, candidate.serialize());
		this.candidates.push(candidate);

		this.initFinishTimeout();
	}

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage(address, cmd, data)
	{
		assert(Buffer.isBuffer(address), `CandidateAgreement handleMessage, address should be an Buffer, now is ${typeof address}`);
		assert(typeof cmd === "number", `CandidateAgreement handleMessage, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(data), `CandidateAgreement handleMessage, data should be an Buffer, now is ${typeof data}`);

		switch(cmd)
		{
			case PROTOCOL_CMD_CANDIDATE_AGREEMENT:
			{
				this.handleCandidateAgreement(data);
			}
			break;
			default:
			{
				super.handleMessage(address, cmd, data);
			}
		}
	}

	/**
	 * @param {Buffer} data
	 */
	handleCandidateAgreement(address, data)
	{
		assert(Buffer.isBuffer(address), `CandidateAgreement handleCandidateAgreement, address should be an Buffer, now is ${typeof address}`);
		assert(Buffer.isBuffer(data), `CandidateAgreement handleCandidateAgreement, data should be an Buffer, now is ${typeof data}`);

		const candidate = new Candidate(data);

		if(candidate.validate())
		{
			if(address.toString("hex") !== candidate.from.toString("hex"))
			{
				logger.error(`CandidateAgreement handleCandidateAgreement, address is invalid, address should be ${address.toString("hex")}, now is ${candidate.from.toString("hex")}`);
			}
			else
			{
				this.candidates.push(candidate);
			}
		}
		else
		{
			logger.error(`CandidateAgreement handleCandidateAgreement, address ${address.toString("hex")}, send an invalid message`);
		}

		this.recordFinishNode(candidate.from.toString("hex"));
	}

	reset()
	{
		super.reset();
		this.candidates = [];
	}
}
module.exports = CandidateAgreement;