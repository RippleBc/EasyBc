const CandidateDigest = require("../data/candidateDigest");
const utils = require("../../../depends/utils");
const ConsensusStage = require("../stage/consensusStage");
const assert = require("assert");
const { STAGE_COMMIT,
  PROTOCOL_CMD_COMMIT,
  STAGE_STATE_EMPTY,
  STAGE_STATE_PROCESSING,
  STAGE_COMMIT_EXPIRATION } = require("../constants");

const Buffer = utils.Buffer;

const unlManager = process[Symbol.for("unlManager")];
const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];

class Commit extends ConsensusStage {
  constructor(ripple) {
    super({ name: 'commit', expiraion: STAGE_COMMIT_EXPIRATION, threshould: parsent(unlManager.fullUnl.length / 2 + 1) })

    this.ripple = ripple;
  }

  run() {
    if (this.state !== STAGE_STATE_EMPTY) {
      logger.fatal(`Commit run, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

      process.exit(1);
    }

    //
    this.state = STAGE_STATE_PROCESSING;

    //
    this.ripple.stage = STAGE_COMMIT;

    // begin timer
    this.startTimer()

    // consensus success
    if (this.ripple.consensusCandidateDigest)
    {
      // broadcast
      p2p.sendAll(PROTOCOL_CMD_COMMIT, this.ripple.consensusCandidateDigest.serialize());

      //
      this.validateAndProcessExchangeData(this.ripple.consensusCandidateDigest, process[Symbol.for("address")]);
    }
  }

  handler() {
    //
    if (!this.ripple.consensusCandidateDigest)
    {
      logger.error("candidateDigest consensus failed, enter to view change state");

      this.ripple.viewChangeForConsensusFail.run();

      return;
    }

    //
    if (this.ripple.hash.toString('hex') !== this.ripple.consensusCandidateDigest.hash.toString('hex')
      || this.ripple.number.toString('hex') !== this.ripple.consensusCandidateDigest.number.toString('hex'))
    {
      logger.error(`candidateDigest consensus success, hash, number should be 
      ${this.ripple.hash.toString('hex')}, ${this.ripple.number.toString('hex')},
      now is ${this.ripple.consensusCandidateDigest.hash.toString('hex')}, ${this.ripple.consensusCandidateDigest.number.toString('hex')}},
      enter to view change state`);

      this.ripple.viewChangeForConsensusFail.run();

      return;
    }

    // fetch consensus candidate
    if (this.ripple.consensusCandidateDigest.hash(false).toString('hex') !== this.ripple.candidateDigest.hash(false).toString('hex')) {
      this.ripple.fetchConsensusCandidate.run(() => {
        this.ripple.processConsensusCandidate();
      })

      return;
    }
  
    this.ripple.processConsensusCandidate();
  }

  /**
   * @param {Buffer} address
   * @param {Number} cmd
   * @param {Buffer} data
   */
  handleMessage(address, cmd, data) {
    assert(Buffer.isBuffer(address), `Commit handleMessage, address should be an Buffer, now is ${typeof address}`);
    assert(typeof cmd === "number", `Commit handleMessage, cmd should be a Number, now is ${typeof cmd}`);
    assert(Buffer.isBuffer(data), `Commit handleMessage, data should be an Buffer, now is ${typeof data}`);

    if (this.state !== STAGE_STATE_PROCESSING) {
      logger.info(`Commit handleMessage, state should be ${STAGE_STATE_PROCESSING}, now is ${this.state}`);

      return;
    }

    switch (cmd) {
      case PROTOCOL_CMD_COMMIT:
        {
          this.validateAndProcessExchangeData(new CandidateDigest(data), address.toString('hex'));
        }
        break;
    }
  }
}

module.exports = Commit;