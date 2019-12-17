const CandidateDigest = require("../data/candidateDigest");
const utils = require("../../../depends/utils");
const ConsensusStage = require("../stage/consensusStage");
const assert = require("assert");
const { STAGE_READY,
  PROTOCOL_CMD_READY,
  STAGE_STATE_EMPTY,
  STAGE_STATE_PROCESSING,
  STAGE_READY_EXPIRATION,
  STAGE_FINISH_SUCCESS } = require("../constants");

const Buffer = utils.Buffer;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];
const unlManager = process[Symbol.for("unlManager")];

class Ready extends ConsensusStage {
  constructor(ripple) {
    super({ name: 'ready', expiration: STAGE_READY_EXPIRATION, threshould: parseInt(unlManager.unlFullSize / 3 + 1) })

    this.ripple = ripple;
  }

  run() {
    if (this.state !== STAGE_STATE_EMPTY) {
      logger.fatal(`Ready run, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

      process[Symbol.for("gentlyExitProcess")]();
    }

    //
    logger.info(`Ready run begin, sequence: ${this.ripple.sequence.toString('hex')}, hash: ${this.ripple.hash.toString('hex')}, number: ${this.ripple.number.toString('hex')}, view: ${this.ripple.view.toString('hex')}`);

    //
    this.state = STAGE_STATE_PROCESSING;

    //
    this.ripple.stage = STAGE_READY;

    // begin timer
    this.startTimer();

    //
    if (this.ripple.consensusCandidateDigest)
    {
      // broadcast
      p2p.sendAll(PROTOCOL_CMD_READY, this.ripple.consensusCandidateDigest.serialize());

      //
      this.validateAndProcessExchangeData(this.ripple.consensusCandidateDigest, process[Symbol.for("address")]);
    }
  }

	/**
	 * @param {Number} code
	 * @param {CandidateDigest} candidateDigest
	 */
  handler(code, candidateDigest) {
    assert(typeof code === 'number', `Ready handler, code should be a Number, now is ${typeof code}`);

    //
    if (code === STAGE_FINISH_SUCCESS) {
      assert(candidateDigest instanceof CandidateDigest, `Ready handler, data should be an instanceof CandidateDigest, now is ${typeof candidateDigest}`);

      // already have consensusCandidateDigest
      if (this.ripple.consensusCandidateDigest)
      {
        return;
      }

      this.ripple.consensusCandidateDigest = new CandidateDigest({
        sequence: candidateDigest.sequence,
        blockHash: candidateDigest.blockHash,
        number: candidateDigest.number,
        timestamp: candidateDigest.timestamp,
        view: candidateDigest.view,
        digest: candidateDigest.digest,
      });
      this.ripple.consensusCandidateDigest.sign(privateKey);
    }
    else {
      logger.info(`Ready handler, failed because of ${code}`);
    }

    //
    this.ripple.commit.run();
  }

  /**
 * @param {Buffer} address
 * @param {Number} cmd
 * @param {Buffer} data
 */
  handleMessage(address, cmd, data) {
    assert(Buffer.isBuffer(address), `Ready handleMessage, address should be an Buffer, now is ${typeof address}`);
    assert(typeof cmd === "number", `Ready handleMessage, cmd should be a Number, now is ${typeof cmd}`);
    assert(Buffer.isBuffer(data), `Ready handleMessage, data should be an Buffer, now is ${typeof data}`);

    if (this.state !== STAGE_STATE_PROCESSING) {
      logger.info(`Ready handleMessage, state should be ${STAGE_STATE_PROCESSING}, now is ${this.state}`);

      return;
    }

    switch (cmd) {
      case PROTOCOL_CMD_READY:
        {
          this.validateAndProcessExchangeData(new CandidateDigest(data), address.toString('hex'));
        }
        break;
    }
  }
}

module.exports = Ready;