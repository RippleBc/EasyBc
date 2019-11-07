const Candidate = require("../data/candidate");
const utils = require("../../../depends/utils");
const assert = require("assert");
const { STAGE_AMALGAMATE, 
	PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ, 
	PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES, 
	STAGE_STATE_EMPTY, 
	STAGE_STATE_PROCESSING, 
	STAGE_STATE_FINISH,
	STAGE_AMALGAMATE_TRANSACTIONS_EXPIRATION } = require("../../constant");
const LeaderStage = require("../stage/leaderStage");

const rlp = utils.rlp;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];
const unlManager = process[Symbol.for ("unlManager")];

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
		if (this.ripple.checkPrimaryNode(process[Symbol.for("address")]))
		{
			// request candidates
			p2p.sendAll(PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ);

			// begin timer
			this.startTimer();
		}
	}

	handler()
	{
		// receiver is leader
		if (this.ripple.checkPrimaryNode(process[Symbol.for("address")])) {

			// 
			for (let localCandidate of this.candidates)
			{
				const decodedTransactions = rlp.decode(localCandidate.transactions);

				for (let decodedTransaction of decodedTransactions) {
					this.ripple.amalgamatedTransactions.add(decodedTransaction.toString('hex'));
				}
			}

			this.ripple.prePrepare.run();
		}
		else
		{
			this.ripple.prePrepare.run();
		}
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
				let localCandidate;

				// sender is leader
				if (this.ripple.checkPrimaryNode(address.toString('hex'))) {

					//
					localCandidate = new Candidate({
						hash: this.ripple.hash,
						number: this.ripple.number,
						view: this.ripple.view,
						transactions: this.ripple.localTransactions.map(localTransaction => Buffer.from(localTransaction, 'hex'))
					});

					//
					this.state = STAGE_STATE_FINISH;

					process.nextTick(() => {
						this.handler();
					});
				}
				else
				{
					localCandidate = new Candidate({
						hash: this.ripple.hash,
						number: this.ripple.number,
						view: this.ripple.view
					});
				}
				
				//
				localCandidate.sign(privateKey);

				p2p.send(address, PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES, localCandidate.serialize());
			}
			break;
			case PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES:
			{
				if (this.ripple.checkPrimaryNode(process[Symbol.for("address")])) {
					this.validateAndProcessExchangeData(new Candidate(data), address.toString('hex'));
				}
			}
			break;
		}
	}
}

module.exports = Amalgamate;