const Candidate = require("../data/candidate");
const utils = require("../../../depends/utils");
const assert = require("assert");
const { STAGE_AMALGAMATE, 
	PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ, 
	PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES, 
	STAGE_STATE_EMPTY, 
	STAGE_STATE_PROCESSING, 
	STAGE_STATE_FINISH,
	STAGE_AMALGAMATE_TRANSACTIONS_EXPIRATION,
	STAGE_FINISH_SUCCESS } = require("../constants");
const LeaderStage = require("../stage/leaderStage");

const rlp = utils.rlp;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class Amalgamate extends LeaderStage
{
	constructor(ripple)
	{
		super({ name: 'amalgamate', expiraion: STAGE_AMALGAMATE_TRANSACTIONS_EXPIRATION})

		this.ripple = ripple;
	}

	run()
	{
		if (this.state !== STAGE_STATE_EMPTY) {
			logger.fatal(`Amalgamate run, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

			process.exit(1);
		}

		//
		this.state = STAGE_STATE_PROCESSING;

		//
		this.ripple.stage = STAGE_AMALGAMATE;
		
		// node is leader
		if (this.ripple.checkLeader(process[Symbol.for("address")]))
		{
			const candidate = new Candidate({
				sequence: this.ripple.sequence,
				hash: this.ripple.hash,
				number: this.ripple.number,
				timestamp: Date.now(),
				view: this.ripple.view
			});
			candidate.sign(privateKey);

			// request candidates
			p2p.sendAll(PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ, candidate.serialize());

			// begin timer
			this.startTimer();

			// record self
			let localCandidate = new Candidate({
				sequence: this.ripple.sequence,
				hash: this.ripple.hash,
				number: this.ripple.number,
				timestamp: Date.now(),
				view: this.ripple.view,
				transactions: rlp.encode(this.ripple.localTransactions.map(localTransaction => Buffer.from(localTransaction, 'hex')))
			});
			localCandidate.sign(privateKey);
			this.validateAndProcessExchangeData(localCandidate, process[Symbol.for("address")]);
		}
		else
		{
			this.ripple.startLeaderTimer();
		}
	}

	handler()
	{
		// node is leader
		if (this.ripple.checkLeader(process[Symbol.for("address")])) {
			for (let localCandidate of this.candidates)
			{
				const decodedTransactions = rlp.decode(localCandidate.transactions);

				for (let decodedTransaction of decodedTransactions) {
					this.ripple.amalgamatedTransactions.add(decodedTransaction.toString('hex'));
				}
			}
		}
		else
		{
			this.ripple.clearLeaderTimer();
		}
		
		this.ripple.prePrepare.run();
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

		if (this.state !== STAGE_STATE_PROCESSING)
		{
			logger.info(`Amalgamate handleMessage, state should be ${STAGE_STATE_PROCESSING}, now is ${this.state}`);

			return;
		}

		switch(cmd)
		{
			case PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ:
			{
				// sender is leader
				if (this.ripple.checkLeader(address.toString('hex'))) {

					//
					let localCandidate = new Candidate({
						sequence: this.ripple.sequence,
						hash: this.ripple.hash,
						number: this.ripple.number,
						timestamp: Date.now(),
						view: this.ripple.view,
						transactions: rlp.encode(this.ripple.localTransactions.map(localTransaction => Buffer.from(localTransaction, 'hex')))
					});
					localCandidate.sign(privateKey);

					//
					this.state = STAGE_STATE_FINISH;

					//
					p2p.send(address, PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES, localCandidate.serialize());

					this.handler(STAGE_FINISH_SUCCESS);
				}
			}
			break;
			case PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES:
			{
				if (this.ripple.checkLeader(process[Symbol.for("address")])) {
					this.validateAndProcessExchangeData(new Candidate(data), address.toString('hex'));
				}
			}
			break;
		}
	}
}

module.exports = Amalgamate;