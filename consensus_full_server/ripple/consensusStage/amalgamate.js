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
const BN = utils.BN;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class Amalgamate extends LeaderStage
{
	constructor(ripple)
	{
		super({ name: 'amalgamate', expiration: STAGE_AMALGAMATE_TRANSACTIONS_EXPIRATION})

		this.ripple = ripple;
	}

	run()
	{
		if (this.state !== STAGE_STATE_EMPTY) {
			logger.fatal(`Amalgamate run, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

			process.exit(1);
		}

		//
		logger.info(`Amalgamate run begin, sequence: ${this.ripple.sequence.toString('hex')}, hash: ${this.ripple.hash.toString('hex')}, number: ${this.ripple.number.toString('hex')}, view: ${this.ripple.view.toString('hex')}`);

		//
		this.state = STAGE_STATE_PROCESSING;

		//
		this.ripple.stage = STAGE_AMALGAMATE;
		
		// check sequence
		const sequenceBN = new BN(this.ripple.sequence);
		if (sequenceBN.lt(this.ripple.lowWaterLine))
		{
			return;
		}
		if (sequenceBN.gte(this.ripple.highWaterLine))
		{
			this.ripple.viewChangeForTimeout.run();

			return;
		}

		// node is leader
		if (this.ripple.checkLeader(process[Symbol.for("address")]))
		{
			logger.info("Amalgamate run, start leader broadcast");

			// update sequence
			this.ripple.sequence = new BN(this.ripple.sequence).addn(1).toBuffer();

			// 
			const reqCandidate = new Candidate({
				sequence: this.ripple.sequence,
				blockHash: this.ripple.hash,
				number: this.ripple.number,
				timestamp: Date.now(),
				view: this.ripple.view
			});
			reqCandidate.sign(privateKey);

			// request candidates
			p2p.sendAll(PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ, reqCandidate.serialize());

			// begin timer
			this.startTimer();

			// record self
			let localCandidate = new Candidate({
				sequence: this.ripple.sequence,
				blockHash: this.ripple.hash,
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
			logger.info("Amalgamate run, start leader timer");

			this.ripple.startLeaderTimer();
		}
	}

	handler(code)
	{
		if(code !== STAGE_FINISH_SUCCESS)
		{
			logger.info(`Amalgamate handler, failed because of ${code}`);
		}

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
			logger.info("Amalgamate handler, clear leader timer");

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
				// check if sender is leader
				if (!this.ripple.checkLeader(address.toString('hex')))
				{
					return;
				}

				// check req candidate
				const reqCandidate = new Candidate(data);
				if(!reqCandidate.validate())
				{
					logger.error(`Amalgamate handleMessage, address: ${address.toString('hex')}, reqCandidate validate failed`)

					return;
				}

				// check sequence
				if (new BN(reqCandidate.sequence).lte(new BN(this.ripple.sequence)))
				{
					logger.error(`Amalgamate handleMessage, address: ${address.toString('hex')}, sequence should bigger than ${this.ripple.sequence.toString('hex')}, now is ${reqCandidate.sequence.toString('hex')}`);
				
					return;
				}
				
				// update sequence
				this.ripple.sequence = reqCandidate.sequence;

				//
				let localCandidate = new Candidate({
					sequence: this.ripple.sequence,
					blockHash: this.ripple.hash,
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