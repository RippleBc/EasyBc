const ViewChange = require("../data/viewChange");
const utils = require("../../../depends/utils");
const Stage = require("../stage/stage");
const assert = require("assert");
const { RIPPLE_STATE_VIEW_CHANGE_FOR_CONSENSUS_FAIL,
  PROTOCOL_CMD_VIEW_CHANGE_FOR_CONSENSUS_FAIL,
  STAGE_STATE_EMPTY,
  STAGE_STATE_PROCESSING,
  STAGE_VIEW_CHANGE_FOR_CONSENSUS_FAIL_EXPIRATION,
  STAGE_FINISH_SUCCESS } = require("../constants");

const Buffer = utils.Buffer;
const BN = utils.BN;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];

class ViewChangeForConsensusFail extends Stage {
  constructor(ripple) {
    super({ name: 'viewChangeForConsensusFail', expiraion: STAGE_VIEW_CHANGE_FOR_CONSENSUS_FAIL_EXPIRATION })

    this.ripple = ripple;
  }

  run() {
    if (this.state !== STAGE_STATE_EMPTY) {
      logger.fatal(`ViewChangeForConsensusFail run, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

      process.exit(1);
    }

    //
    this.state = STAGE_STATE_PROCESSING;

    //
    this.ripple.state = RIPPLE_STATE_VIEW_CHANGE_FOR_CONSENSUS_FAIL;

    //
    const viewChange = new ViewChange({
      sequence: this.ripple.sequence,
      hash: this.ripple.hash,
      number: this.ripple.number,
      view: this.ripple.view
    });
    viewChange.sign(privateKey);

    // broadcast
    p2p.sendAll(PROTOCOL_CMD_VIEW_CHANGE_FOR_CONSENSUS_FAIL, viewChange.serialize());

    // begin timer
    this.startTimer();

    //
    this.validateAndProcessExchangeData(viewChange, process[Symbol.for("address")]);
  }

  /**
   * @param {Number} code
   */
  handler(code) {
    if (code === STAGE_FINISH_SUCCESS)
    {
      this.ripple.view = new BN(this.ripple.view).addn(1).toBuffer();

      this.ripple.runNewConsensusRound();
    }
    else
    {
      if (this.ripple.consensusCandidateDigest)
      {
        // consensus success
        // hash, number, view check failed
        // and view change failed
        // try to sync state
        this.ripple.fetchProcessState.syncNodeState();
      }
      else
      {
        logger.fatal(`ViewChangeForConsensusFail handler, view change consensus failed`);

        process.exit(1);
      }
    }
  }

  /**
   * @param {Buffer} address
   * @param {Number} cmd
   * @param {Buffer} data
   */
  handleMessage(address, cmd, data) {
    assert(Buffer.isBuffer(address), `ViewChangeForConsensusFail handleMessage, address should be an Buffer, now is ${typeof address}`);
    assert(typeof cmd === "number", `ViewChangeForConsensusFail handleMessage, cmd should be a Number, now is ${typeof cmd}`);
    assert(Buffer.isBuffer(data), `ViewChangeForConsensusFail handleMessage, data should be an Buffer, now is ${typeof data}`);

    if (this.state !== STAGE_STATE_PROCESSING) {
      logger.info(`ViewChangeForConsensusFail handleMessage, state should be ${STAGE_STATE_PROCESSING}, now is ${this.state}`);

      return;
    }

    switch (cmd) {
      case PROTOCOL_CMD_VIEW_CHANGE_FOR_CONSENSUS_FAIL:
        {
          this.validateAndProcessExchangeData(new ViewChange(data), address.toString('hex'));
        }
        break;
    }
  }
}

module.exports = ViewChangeForConsensusFail;