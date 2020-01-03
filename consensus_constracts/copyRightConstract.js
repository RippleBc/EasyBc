const assert = require("assert");
const Account = require("../depends/account");
const utils = require("../depends/utils");
const StateManager = require("../depends/block_chain/stateManager");
const Transaction = require("../depends/transaction");
const Constract = require("./constract");

const rlp = utils.rlp;
const BN = utils.BN;
const bufferToInt = utils.bufferToInt;

const COMMAND_TRANSFER = 100;

class CopyRight extends Constract {
  constructor(data) {
    super(CopyRight.id);

    data = data || {};

    let fields = [{
      length: 32,
      name: "id",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      length: 32,
      name: "state",
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      name: "timestamp",
      length: 32,
      allowLess: true,
      default: Buffer.alloc(1)
    }, {
      name: "owner",
      length: 20,
      default: Buffer.alloc(20)
    }, {
      length: 32,
      name: "contentDigest",
      default: Buffer.alloc(32)
    }];

    utils.defineProperties(this, fields, data);
  }

  /**
   * @param {Buffer} timestamp
   * @param {StateManager} stateManager
   * @param {Transaction} tx
   * @param {Account} fromAccount
   * @param {Account} toAccount
   */
  async commandHandler({ timestamp, stateManager, tx, fromAccount, toAccount }) {
    assert(Buffer.isBuffer(timestamp), `CopyRight run, timestamp should be an Buffer, now is ${typeof timestamp}`);
    assert(stateManager instanceof StateManager, `CopyRight run, stateManager should be an instance of StateManager, now is ${typeof stateManager}`);
    assert(tx instanceof Transaction, `CopyRight run, tx should be an instance of Transaction, now is ${typeof tx}`);
    assert(fromAccount instanceof Account, `CopyRight run, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `CopyRight run, toAccount should be an instance of Account, now is ${typeof toAccount}`);

    const commands = rlp.decode(tx.data);

    switch (bufferToInt(commands[0])) {
      case COMMAND_TRANSFER:
        {
          if(tx.from.toString('hex') !== this.owner.toString('hex'))
          {
            throw new Error(`CopyRight commandHandler, invalid address ${tx.from.toString('hex')}`);
          }

          //
          this.owner = commands[1];
        }
        break;
      default:
        {
          await Promise.reject(`CopyRight commandHandler, invaid command, ${parseInt(commands[0])}`)
        }
    }
  }

  /**
   * @param {Buffer} owner
   * @param {Buffer} contentDigest
   */
  async create(owner, contentDigest, { timestamp }) {
    assert(Buffer.isBuffer(owner), `CopyRight create, owner should be an Buffer, now is ${typeof owner}`);
    assert(Buffer.isBuffer(contentDigest), `CopyRight create, contentDigest should be an Buffer, now is ${typeof contentDigest}`);
    assert(Buffer.isBuffer(timestamp), `CopyRight create, timestamp should be an Buffer, now is ${typeof timestamp}`);

    this.timestamp = timestamp;
    this.owner = owner;
    this.contentDigest = contentDigest;
  }
}

CopyRight.id = "04";

module.exports = CopyRight;