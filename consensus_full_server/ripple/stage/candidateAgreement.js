const Candidate = require("../data/candidate");
const utils = require("../../../depends/utils");
const Stage = require("./stage");
const { unl } = require("../../config.json");
const assert = require("assert");
const Transaction = require("../../../depends/transaction");
const { TRANSACTIONS_CONSENSUS_THRESHOULD, RIPPLE_STAGE_CANDIDATE_AGREEMENT, PROTOCOL_CMD_CANDIDATE_AGREEMENT, PROTOCOL_CMD_CANDIDATE_AGREEMENT_FINISH_STATE_REQUEST, PROTOCOL_CMD_CANDIDATE_AGREEMENT_FINISH_STATE_RESPONSE } = require("../../constant");

const sha256 = utils.sha256;
const rlp = utils.rlp;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class CandidateAgreement extends Stage
{
	constructor(ripple)
	{
		super({
			synchronize_state_request_cmd: PROTOCOL_CMD_CANDIDATE_AGREEMENT_FINISH_STATE_REQUEST,
			synchronize_state_response_cmd: PROTOCOL_CMD_CANDIDATE_AGREEMENT_FINISH_STATE_RESPONSE
		});

		this.ripple = ripple;
		this.candidates = [];
	}

	handler(ifSuccess)
	{
		if(ifSuccess)
		{
			logger.info("CandidateAgreement handler success")
		}
		else
		{
			logger.info("CandidateAgreement handler success becauseof timeout")
		}
		
		const transactionCollsHash = new Map();
		this.candidates.forEach(candidate => {
			const key = sha256(candidate.transactions).toString('hex');

			if(transactionCollsHash.has(key))
			{
				const count = transactionCollsHash.get(key).count;

				transactionCollsHash.set(key, {
					count: count + 1,
					data: candidate.transactions
				});
			}
			else
			{
				transactionCollsHash.set(key, {
					count: 1,
					data: candidate.transactions
				});
			}
		});

		
		const sortedTransactionColls = [...transactionCollsHash].sort(transactionColl => {
			return -transactionColl[1].count;
		});

		if(sortedTransactionColls[0] && sortedTransactionColls[0][1].count / (unl.length + 1) >= TRANSACTIONS_CONSENSUS_THRESHOULD)
		{
			logger.trace("CandidateAgreement handler, candidate agreement success, go to next stage");

			this.ripple.blockAgreement.run(sortedTransactionColls[0][1].data);

			this.reset();

			return;
		}
		
		// return to amalgamate stage
		logger.trace("CandidateAgreement handler, candidate agreement failed, go to stage amalgamate");

		// mixed all transactions, and begin to amalgamate
		const transactionRawsMap = new Map();
		this.candidates.forEach(candidate => {
			const rawTransactions = rlp.decode(candidate.transactions);

			rawTransactions.forEach(rawTransaction => {
				transactionRawsMap.set(rawTransaction.toString("hex"), rawTransaction);
			});
		});

		this.ripple.amalgamate.run([...transactionRawsMap.values()]);

		this.reset();
	}

	/**
	 * @param {Array/Buffer} transactions
	 */
	run(transactions)
	{
		assert(Array.isArray(transactions), `CandidateAgreement run, transactions should be an Array, now is ${typeof transactions}`);

		this.ripple.stage = RIPPLE_STAGE_CANDIDATE_AGREEMENT;
		this.start();

		// sort transactions
		transactions = transactions.sort(tx => tx.toString("hex"));

		// init candidate
		const candidate = new Candidate({
			transactions: rlp.encode(transactions)
		});
		candidate.sign(privateKey);

		// broadcast candidate
		p2p.sendAll(PROTOCOL_CMD_CANDIDATE_AGREEMENT, candidate.serialize());

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
		assert(Buffer.isBuffer(address), `CandidateAgreement handleMessage, address should be an Buffer, now is ${typeof address}`);
		assert(typeof cmd === "number", `CandidateAgreement handleMessage, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(data), `CandidateAgreement handleMessage, data should be an Buffer, now is ${typeof data}`);

		switch(cmd)
		{
			case PROTOCOL_CMD_CANDIDATE_AGREEMENT:
			{
				this.handleCandidateAgreement(address, data);
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
	handleCandidateAgreement(address, data)
	{
		assert(Buffer.isBuffer(address), `CandidateAgreement handleCandidateAgreement, address should be an Buffer, now is ${typeof address}`);
		assert(Buffer.isBuffer(data), `CandidateAgreement handleCandidateAgreement, data should be an Buffer, now is ${typeof data}`);

		const candidate = new Candidate(data);

		if(candidate.validate())
		{
			if(address.toString("hex") !== candidate.from.toString("hex"))
			{
				this.cheatedNodes.push(address.toString('hex'));

				logger.info(`CandidateAgreement handleCandidateAgreement, address should be ${address.toString("hex")}, now is ${candidate.from.toString("hex")}`);
			}
			else
			{
				if(this.checkIfNodeFinishDataExchange(address.toString("hex")))
				{
					logger.info(`CandidateAgreement handleCandidateAgreement, address: ${address.toString("hex")}, send the same exchange data`);
					
					this.cheatedNodes.push(address.toString('hex'));
				}
				else
				{
					this.candidates.push(candidate);
				}
			}
		}
		else
		{
			this.cheatedNodes.push(address.toString('hex'));
			
			logger.info(`CandidateAgreement handleCandidateAgreement, address ${address.toString("hex")}, validate failed`);
		}

		this.recordDataExchangeFinishNode(address.toString("hex"));
	}

	reset()
	{
		super.reset();
		this.candidates = [];
	}
}
module.exports = CandidateAgreement;