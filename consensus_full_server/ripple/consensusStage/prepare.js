const CandidateDigest = require("../data/candidateDigest");
const utils = require("../../../depends/utils");
const ConsensusStage = require("../stage/consensusStage");
const assert = require("assert");
const { RIPPLE_STAGE_PREPARE,
	PROTOCOL_CMD_PREPARE,
	STAGE_STATE_EMPTY,
	STAGE_STATE_PROCESSING,
	STAGE_PREPARE_EXPIRATION } = require("../../constant");

const Buffer = utils.Buffer;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];

class Prepare extends ConsensusStage
{
	constructor(ripple)
	{
		super({ name: 'prepare', expiraion: STAGE_PREPARE_EXPIRATION })

		this.ripple = ripple;
	}

 	run()
 	{
		if (this.state !== STAGE_STATE_EMPTY) {
			logger.fatal(`Prepare run, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

			process.exit(1);
		}

		//
		this.state = STAGE_STATE_PROCESSING;

		//
		this.ripple.stage = RIPPLE_STAGE_PREPARE;

		// broadcast
		p2p.sendAll(PROTOCOL_CMD_PREPARE, this.ripple.candidateDigest.serialize())

		// begin timer
		this.startTimer()
 	}

	handler() {
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