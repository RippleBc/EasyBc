const ViewChange = require("../data/viewChange");
const utils = require("../../../depends/utils");
const assert = require("assert");
const { PROTOCOL_CMD_VIEW_CHANGE_FOR_TIMEOUT,
  CHEAT_REASON_INVALID_SIG,
  CHEAT_REASON_INVALID_ADDRESS,
  RIPPLE_STATE_NEW_VIEW } = require("../constants");

const Buffer = utils.Buffer;
const BN = utils.BN;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class ViewChangeForTimeout {
  constructor(ripple) {
    this.ripple = ripple;

    this.threshould = this.ripple.threshould;

    this.cheatedNodes = [];

    this.trimedViewChangesByAddress = new Map();
    this.trimedViewChangesByHash = new Map();

    this.consensusViewChange = undefined;
  }

  /**
   * @param {Buffer} view 
   */
  run(view = this.ripple.view) {
    assert(Buffer.isBuffer(view), `ViewChangeForTimeout run, view should be a Buffer, now is ${typeof view}`);

    logger.info(`ViewChangeForTimeout run begin, sequence: ${this.ripple.sequence.toString('hex')}, hash: ${this.ripple.hash.toString('hex')}, number: ${this.ripple.number.toString('hex')}, view: ${view.toString('hex')}`);

    const viewChange = new ViewChange({
      sequence: this.ripple.sequence,
      blockHash: this.ripple.hash,
      number: this.ripple.number,
      view: view
    });
    viewChange.sign(privateKey);

    //
    if (this.ripple.nextViewLeaderAddress(view).toString('hex') === process[Symbol.for("address")])
    {
      if (this.ripple.state === RIPPLE_STATE_NEW_VIEW) {
        // newView has begun, 
        // do not accept repeated view change message
        return;
      }
      
      // node is new leader
      this.validateAndProcessExchangeData(viewChange, process[Symbol.for("address")]);
    }
    else
    {
      // send to new leader
      p2p.send(this.ripple.nextViewLeaderAddress(view), PROTOCOL_CMD_VIEW_CHANGE_FOR_TIMEOUT, viewChange.serialize());
    }
  }

  handler() {
    // update view
    this.ripple.view = new BN(this.consensusViewChange.view).addn(1).toBuffer();

    // update sequence
    this.ripple.sequence = this.ripple.lowWaterLine.toBuffer();

    //
    this.ripple.newView.run();
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
          if (this.ripple.state === RIPPLE_STATE_NEW_VIEW) {
            // newView has begun, 
            // do not accept repeated view change message
            return;
          }
          
          this.validateAndProcessExchangeData(new ViewChange(data), address.toString('hex'));
        }
        break;
    }
  }

  /**
   * @param {ViewChange} viewChange
   * @param {String} address
   */
  validateAndProcessExchangeData(viewChange, address)
  {
    assert(viewChange instanceof ViewChange, `ViewChangeForTimeout validateAndProcessExchangeData, viewChange should be an instance of ViewChange, now is ${typeof viewChange}`);
    assert(typeof address === 'string', `ViewChangeForTimeout validateAndProcessExchangeData, address should be a String, now is ${typeof address}`);
    
    // check sig
    if (!viewChange.validate()) {
      logger.error(`ViewChangeForTimeout validateAndProcessExchangeData validate, address: ${address}, validate failed`);

      this.cheatedNodes.push({
        address: address,
        reason: CHEAT_REASON_INVALID_SIG
      });
    }

    // check if msg address is correspond with connect address
    if (address !== viewChange.from.toString("hex")) {
      logger.error(`ViewChangeForTimeout validateAndProcessExchangeData validate, address should be ${address}, now is ${viewChange.from.toString("hex")}`);

      this.cheatedNodes.push({
        address: address,
        reason: CHEAT_REASON_INVALID_ADDRESS
      });
    }

    //
    const updateTrimedViewChangesByHash = (viewChange, type) => {
      const viewChangeHash = viewChange.hash(false).toString('hex');
      let viewChangeByHashDetail = this.trimedViewChangesByHash.get(viewChangeHash);
      if (viewChangeByHashDetail) {
        if (type === 1) {
          viewChangeByHashDetail.count += 1;

          this.trimedViewChangesByHash.set(viewChangeHash, viewChangeByHashDetail); 

          if (viewChangeByHashDetail.count >= this.threshould) {
            this.consensusViewChange = viewChangeByHashDetail.data;

            this.handler();
          }
        }
        else {
          viewChangeByHashDetail.count -= 1;
          if (viewChangeByHashDetail.count === 0) {
            this.trimedViewChangesByHash.delete(viewChangeHash);
          }
          else
          {
            this.trimedViewChangesByHash.set(viewChangeHash, viewChangeByHashDetail); 
          }
        }
      }
      else {
        if (type === 1) {
          this.trimedViewChangesByHash.set(viewChangeHash, {
            data: viewChange,
            count: 1
          });
        }
        else
        {
          logger.fatal(`ViewChangeForTimeout validateAndProcessExchangeData, updateTrimedViewChangesByHash, inner exception`);
          
          process.exit(1);
        }
      }     
    }

    // fetch viewChange detail by address
    const fromAddress = viewChange.from.toString('hex');
    let viewChangeByAddress = this.trimedViewChangesByAddress.get(fromAddress);

    // record by address
    this.trimedViewChangesByAddress.set(fromAddress, viewChange);

    //
    if (viewChangeByAddress) {
      // record by hash(desc)
      updateTrimedViewChangesByHash(viewChangeByAddress, 0)
    }
    
    // record by hash(asc)
    updateTrimedViewChangesByHash(viewChange, 1);

  }

  reset() {
    this.cheatedNodes = [];

    this.trimedViewChangesByAddress.clear();
    this.trimedViewChangesByHash.clear();

    this.consensusViewChange = undefined;
  }
}

module.exports = ViewChangeForTimeout;