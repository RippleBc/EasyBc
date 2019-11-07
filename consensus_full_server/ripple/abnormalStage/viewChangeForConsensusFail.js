const ViewChange = require("../data/viewChange");
const utils = require("../../../depends/utils");
const Stage = require("../stage/stage");
const assert = require("assert");
const { RIPPLE_STATE_VIEW_CHANGE_FOR_CONSENSUS_FAIL,
  PROTOCOL_CMD_VIEW_CHANGE_FOR_CONSENSUS_FAIL,
  STAGE_STATE_EMPTY,
  STAGE_STATE_PROCESSING,
  STAGE_VIEW_CHANGE_FOR_CONSENSUS_FAIL_EXPIRATION } = require("../../constant");

const Buffer = utils.Buffer;
const BN = utils.BN;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const unlManager = process[Symbol.for("unlManager")];

class ViewChangeForConsensusFail extends Stage {
  constructor(ripple) {
    super({ name: 'viewChangeForConsensusFail', expiraion: STAGE_VIEW_CHANGE_FOR_CONSENSUS_FAIL_EXPIRATION, threshould: unlManager.threshould })

    this.ripple = ripple;

    this.trimedViewChanges = new Map();
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
      hash: this.ripple.hash,
      number: this.ripple.number,
      view: this.ripple.view
    });
    viewChange.sign(privateKey);

    // broadcast
    p2p.sendAll(PROTOCOL_CMD_VIEW_CHANGE_FOR_CONSENSUS_FAIL, viewChange.serialize())

    // begin timer
    this.startTimer()
  }

  /**
   * @param {Bolean} ifViewChangeSuccess
   */
  handler(ifViewChangeSuccess = false) {
    if (ifViewChangeSuccess)
    {
      this.ripple.view = new BN(this.ripple.view).addn(1).toBuffer();
    }

    this.ripple.run()
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

    switch (cmd) {
      case PROTOCOL_CMD_VIEW_CHANGE_FOR_CONSENSUS_FAIL:
        {
          this.validateAndProcessExchangeData(new ViewChange(data), address.toString('hex'));
        }
        break;
    }
  }

  /**
   * 
   * @param {Base} viewChange 
   */
  enterNextStage(viewChange) {
    assert(viewChange instanceof Base, `${this.name} ConsensusStage, viewChange should be an instance of Base, now is ${typeof viewChange}`);

    //
    const viewChangeHash = viewChange.hash(false).toString('hex');
    let viewChangeDetail = this.trimedViewChanges.get(viewChangeHash);
    if (viewChangeDetail) {
      viewChangeDetail.count += 1;
    }
    else {
      viewChangeDetail.data = viewChange;
      viewChangeDetail.count = 1;
    }
    this.trimedViewChanges.set(viewChangeHash, viewChangeDetail);

    //
    if (viewChangeDetail.count > this.threshould) {
      this.state = STAGE_STATE_FINISH;

      clearTimeout(this.timeout);

      process.nextTick(() => {
        this.handler(true);
      });

      return;
    }

    if (this.finishedNodes.size >= unlManager.fullUnl.length) {
      this.state = STAGE_STATE_FINISH;

      clearTimeout(this.timeout);

      process.nextTick(() => {
        this.handler()
      })
    }
  }

  reset() {
    super.reset();

    this.trimedViewChanges.clear();
  }
}

module.exports = ViewChangeForConsensusFail;