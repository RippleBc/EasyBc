const CandidateDigest = require("../data/candidateDigest");
const utils = require("../../../depends/utils");
const ConsensusStage = require("../stage/consensusStage");
const assert = require("assert");
const { STAGE_PREPARE,
	PROTOCOL_CMD_PREPARE,
	STAGE_STATE_EMPTY,
	STAGE_STATE_PROCESSING,
	STAGE_PREPARE_EXPIRATION,
	STAGE_FINISH_SUCCESS } = require("../constants");

const Buffer = utils.Buffer;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class Prepare extends ConsensusStage
{
	constructor(ripple)
	{
		super({ name: 'prepare', expiration: STAGE_PREPARE_EXPIRATION })

		this.ripple = ripple;
	}

 	run()
 	{
		if (this.state !== STAGE_STATE_EMPTY) {
			logger.fatal(`Prepare run, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

			process.exit(1);
		}

		//
		logger.info(`Prepare run begin, 
		sequence: ${this.ripple.sequence.toString('hex')}, 
		hash: ${this.ripple.hash.toString('hex')}, 
		number: ${this.ripple.number.toString('hex')},
		view: ${this.ripple.view.toString('hex')}`);
			
		//
		this.state = STAGE_STATE_PROCESSING;

		//
		this.ripple.stage = STAGE_PREPARE;

		// broadcast
		p2p.sendAll(PROTOCOL_CMD_PREPARE, this.ripple.candidateDigest.serialize());

		// begin timer
		this.startTimer();

		//
		this.validateAndProcessExchangeData(this.ripple.candidateDigest, process[Symbol.for("address")]);
 	}

	/**
	 * @param {Number} code
	 * @param {CandidateDigest} candidateDigest
	 */
	handler(code, candidateDigest) {
		assert(typeof code === 'number', `Prepare handler, code should be a Number, now is ${typeof code}`);
		
		//
		if (code === STAGE_FINISH_SUCCESS) {
			assert(candidateDigest instanceof CandidateDigest, `Prepare handler, data should be an instanceof CandidateDigest, now is ${typeof candidateDigest}`);

			this.ripple.consensusCandidateDigest = candidateDigest;
			this.ripple.consensusCandidateDigest.sign(privateKey)
		}
		else
		{
			logger.info(`Prepare handler, failed because of ${code}`);
		}

		//
		this.ripple.commit.run();
	}

 	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage(address, cmd, data)
	{
		assert(Buffer.isBuffer(address), `Prepare handleMessage, address should be an Buffer, now is ${typeof address}`);
		assert(typeof cmd === "number", `Prepare handleMessage, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(data), `Prepare handleMessage, data should be an Buffer, now is ${typeof data}`);

		if (this.state !== STAGE_STATE_PROCESSING) {
			logger.info(`Prepare handleMessage, state should be ${STAGE_STATE_PROCESSING}, now is ${this.state}`);

			return;
		}

		switch(cmd)
		{
			case PROTOCOL_CMD_PREPARE:
			{
				this.validateAndProcessExchangeData(new CandidateDigest(data), address.toString('hex'));
			}
			break;
		}
	}
}

module.exports = Prepare;