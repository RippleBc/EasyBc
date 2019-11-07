const ViewChange = require("../data/viewChange");
const utils = require("../../../depends/utils");
const LeaderStage = require("../stage/leaderStage");
const assert = require("assert");
const { RIPPLE_STAGE_VIEW_CHANGE_FOR_TIMEOUT,
  PROTOCOL_CMD_VIEW_CHANGE_FOR_TIMEOUT,
  STAGE_STATE_EMPTY,
  STAGE_STATE_PROCESSING,
  STAGE_VIEW_CHANGE_FOR_TIMEOUT_EXPIRATION } = require("../../constant");

const Buffer = utils.Buffer;
const BN = utils.BN;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const unlManager = process[Symbol.for("unlManager")];

class ViewChangeForTimeout extends LeaderStage {
  constructor(ripple) {
    super({ name: 'viewChangeTimeout', expiraion: STAGE_VIEW_CHANGE_FOR_TIMEOUT_EXPIRATION, threshould: unlManager.threshould })

    this.ripple = ripple;

    this.trimedViewChangesByAddress = new Map();
    this.trimedViewChangesByHash = new Map();

    this.consensusViewChange = undefined;
  }

  run() {
    if (this.state !== STAGE_STATE_EMPTY) {
      logger.fatal(`ViewChangeForTimeout run, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

      process.exit(1);
    }

    //
    this.state = STAGE_STATE_PROCESSING;

    //
    this.ripple.stage = RIPPLE_STAGE_VIEW_CHANGE_FOR_TIMEOUT;

    //
    const viewChange = new ViewChange({
      hash: this.ripple.hash,
      number: this.ripple.number,
      view: this.ripple.view
    });
    viewChange.sign(privateKey);

    // broadcast 
    p2p.send(PROTOCOL_CMD_VIEW_CHANGE_FOR_TIMEOUT, todo)

    // begin timer
    this.startTimer()
  }

  /**
   * @param {Bolean} ifViewChangeSuccess
   */
  handler(ifViewChangeSuccess = false) {
    if (ifViewChangeSuccess) {
      this.ripple.view = new BN(this.ripple.view).addn(1).toBuffer();
    }

    this.ripple.newView.run()
  }

  /**
   * @param {Buffer} address
   * @param {Number} cmd
   * @param {Buffer} data
   */
  handleMessage(address, cmd, data) {
    assert(Buffer.isBuffer(address), `ViewChangeForTimeout handleMessage, address should be an Buffer, now is ${typeof address}`);
    assert(typeof cmd === "number", `ViewChangeForTimeout handleMessage, cmd should be a Number, now is ${typeof cmd}`);
    assert(Buffer.isBuffer(data), `ViewChangeForTimeout handleMessage, data should be an Buffer, now is ${typeof data}`);

    switch (cmd) {
      case PROTOCOL_CMD_VIEW_CHANGE_FOR_TIMEOUT:
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

    const updateTrimedViewChangesByHash = (viewChange, type) => {
      //
      const viewChangeHash = viewChange.hash(false).toString('hex');
      let viewChangeByHashDetail = this.trimedViewChangesByHash.get(viewChangeHash);
      if (viewChangeByHashDetail) {
        if (type === 1) {
          viewChangeByHashDetail.count += 1;
        }
        else {
          viewChangeByHashDetail.count -= 1;
          if (viewChangeByHashDetail.count === 0)
          {
            this.trimedViewChangesByHash.delete(viewChangeHash);
          }
        }
      }
      else {
        viewChangeByHashDetail.data = viewChange;
        viewChangeByHashDetail.count = 1;
      }
      this.trimedViewChangesByHash.set(viewChangeHash, viewChangeByHashDetail);

      return viewChangeByHashDetail;
    }

    //
    const fromAddress = viewChange.fromAddress.toString('hex');
    let viewChangeByAddressDetail = this.trimedViewChangesByAddress.get(fromAddress);
    if (viewChangeByAddressDetail) {
      if (new BN(viewChange).gt(new BN(viewChangeByAddressDetail.number)))
      {
        //
        updateTrimedViewChangesByHash(viewChangeByAddressDetail.data, 0)
        updateTrimedViewChangesByHash(viewChange, 1);

        //
        viewChangeByAddressDetail.data = viewChange;

        this.trimedViewChangesByAddress.set(from, viewChangeByAddressDetail);
      }
    }
    else
    {
      this.trimedViewChangesByAddress.set(from, {
        data: viewChange,
        count: 1
      });
    }

    //
    if (viewChangeDetail.count > this.threshould) {
      this.consensusViewChange = viewChangeDetail.data;
      this.consensusViewChange.sign(privateKey);

      //
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
      });
    }
  }

  reset() {
    super.reset();

    this.trimedViewChangesByAddress.clear();
    this.trimedViewChangesByHash.clear();

    this.consensusViewChange = undefined;
  }
}

module.exports = ViewChangeForTimeout;