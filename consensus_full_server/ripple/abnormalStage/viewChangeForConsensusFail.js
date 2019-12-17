const ViewChange = require("../data/viewChange");
const utils = require("../../../depends/utils");
const ConsensusStage = require("../stage/consensusStage");
const assert = require("assert");
const { STAGE_VIEW_CHANGE_FOR_CONSENSUS_FAIL,
  PROTOCOL_CMD_VIEW_CHANGE_FOR_CONSENSUS_FAIL,
  STAGE_STATE_EMPTY,
  STAGE_STATE_PROCESSING,
  STAGE_VIEW_CHANGE_FOR_CONSENSUS_FAIL_EXPIRATION,
  STAGE_FINISH_SUCCESS } = require("../constants");

const Buffer = utils.Buffer;
const BN = utils.BN;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class ViewChangeForConsensusFail extends ConsensusStage {
  constructor(ripple) {
    super({ name: 'viewChangeForConsensusFail', expiration: STAGE_VIEW_CHANGE_FOR_CONSENSUS_FAIL_EXPIRATION })

    this.ripple = ripple;
  }

  run() {
    if (this.state !== STAGE_STATE_EMPTY) {
      logger.fatal(`ViewChangeForConsensusFail run, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

      process[Symbol.for("gentlyExitProcess")]();
    }

    logger.info(`ViewChangeForConsensusFail run begin, sequence: ${this.ripple.sequence.toString('hex')}, hash: ${this.ripple.hash.toString('hex')}, number: ${this.ripple.number.toString('hex')}, view: ${this.ripple.view.toString('hex')}`);

    //
    this.state = STAGE_STATE_PROCESSING;

    //
    this.ripple.stage = STAGE_VIEW_CHANGE_FOR_CONSENSUS_FAIL;

    //
    const viewChange = new ViewChange({
      sequence: this.ripple.sequence,
      blockHash: this.ripple.hash,
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
   * @param {ViewChange} viewChange
   */
  handler(code, viewChange) {
    assert(typeof code === 'number', `ViewChangeForConsensusFail handler, code should be a Number, now is ${typeof code}`);

    if (code === STAGE_FINISH_SUCCESS)
    {
      assert(viewChange instanceof ViewChange, `ViewChangeForConsensusFail handler, viewChange should be an instanceof ViewChange, now is ${typeof viewChange}`);
      
      // update view
      this.ripple.view = new BN(viewChange.view).addn(1).toBuffer();

      // update sequence
      this.ripple.sequence = this.ripple.lowWaterLine.toBuffer();

      // reset
      this.ripple.viewChangeForTimeout.reset();
      this.ripple.newView.reset();
      
      //
      this.ripple.runNewConsensusRound();
    }
    else
    {
      logger.info(`ViewChangeForConsensusFail handler, failed because of ${code}`);

      if (this.ripple.decidedCandidateDigest)
      {
        // consensus success
        // hash, number check failed(out of date)
        // try to sync state
        this.ripple.syncProcessState();
      }
      else
      {

        // consensus failed
        logger.fatal(`ViewChangeForConsensusFail handler, view change consensus failed`);

        process[Symbol.for("gentlyExitProcess")]();
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