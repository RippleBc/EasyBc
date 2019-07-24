const Candidate = require("../data/candidate");
const utils = require("../../../depends/utils");
const Stage = require("./stage");
const assert = require("assert");
const { RIPPLE_STAGE_PERISH_PROCESSING_CHEATED_NODES, RIPPLE_STAGE_PERISH, RIPPLE_STAGE_COUNTER, RIPPLE_STAGE_COUNTER_FETCHING_NEW_TRANSACTIONS, RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK, RIPPLE_STAGE_BLOCK_AGREEMENT, STAGE_STATE_EMPTY, RIPPLE_STAGE_AMALGAMATE, PROTOCOL_CMD_CANDIDATE_AMALGAMATE, PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_REQUEST, PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_RESPONSE } = require("../../constant");

const rlp = utils.rlp;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class Amalgamate extends Stage
{
	constructor(ripple)
	{
		super({
			name: 'amalgamate',
			synchronize_state_request_cmd: PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_REQUEST,
			synchronize_state_response_cmd: PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_RESPONSE
		});

		this.ripple = ripple;
		this.candidates = [];
	}

	handler({ ifSuccess = true, ifCheckState = true } = { ifSuccess: true, ifCheckState: true })
	{
		if(ifCheckState && !this.checkIfDataExchangeIsFinish())
		{
			logger.fatal(`Amalgamate handler, amalgamate data exchange should finish, current state is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);
			
			process.exit(1)
		}

		if(ifSuccess)
		{
			logger.info("Amalgamate handler success")
		}
		else
		{
			logger.info("Amalgamate handler success because of timeout")
		}
		
		const transactionRawsMap = new Map();
		this.candidates.forEach(candidate => {
			const rawTransactions = rlp.decode(candidate.transactions);

			rawTransactions.forEach(rawTransaction => {
				transactionRawsMap.set(rawTransaction.toString("hex"), rawTransaction);
			});
		});

		this.reset();
		this.ripple.candidateAgreement.run([...transactionRawsMap.values()]);
	}

	/**
	 * @param {Array} transactionRaws
	 */
	run(transactionRaws)
	{
		assert(Array.isArray(transactionRaws), `Amalgamate run, transactionRaws should be an Array, now is ${typeof transactionRaws}`);

		if(this.state !== STAGE_STATE_EMPTY)
		{
			logger.fatal(`Amalgamate run, amalgamate state should be STAGE_STATE_EMPTY, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);
			
			process.exit(1)
		}
		
		if(this.ripple.stage !== RIPPLE_STAGE_BLOCK_AGREEMENT 
			&& this.ripple.stage !== RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK
			&& this.ripple.stage !== RIPPLE_STAGE_COUNTER
			&& this.ripple.stage !== RIPPLE_STAGE_COUNTER_FETCHING_NEW_TRANSACTIONS
			&& this.ripple.stage !== RIPPLE_STAGE_PERISH
			&& this.ripple.stage !== RIPPLE_STAGE_PERISH_PROCESSING_CHEATED_NODES)
			{
				logger.fatal(`Amalgamate run, ripple stage should be ${RIPPLE_STAGE_BLOCK_AGREEMENT}, ${RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK}, ${RIPPLE_STAGE_COUNTER}, ${RIPPLE_STAGE_COUNTER_FETCHING_NEW_TRANSACTIONS}, ${RIPPLE_STAGE_PERISH} or ${RIPPLE_STAGE_PERISH_PROCESSING_CHEATED_NODES}, now is ${this.ripple.stage}, ${process[Symbol.for("getStackInfo")]()}`);
			
				process.exit(1)
			}

		this.ripple.stage = RIPPLE_STAGE_AMALGAMATE;
		this.start();
		
		// init candidate
		const candidate = new Candidate({
			transactions: rlp.encode(transactionRaws),
			timestamp: Date.now()
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
				this.handleAmalgamate(address, data);
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

		this.validateAndProcessExchangeData(candidate, this.candidates, address.toString("hex"))
	}

	reset()
	{
		super.reset();
		this.candidates = [];
	}
}

module.exports = Amalgamate;