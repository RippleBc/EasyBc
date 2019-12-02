const utils = require("../utils");
const assert = require("assert");

const BN = utils.BN;
const Buffer = utils.Buffer;
const sha256 = utils.sha256;

class BlockHeader
{
  constructor(data)
  {
    data = data || {};

    var fields = [{
      name: "parentHash",
      length: 32,
      default: Buffer.alloc(32)
    }, {
      name: "stateRoot",
      length: 32,
      default: Buffer.alloc(32)
    }, {
      name: "receiptRoot",
      length: 32,
      default: Buffer.alloc(32)
    }, {
      name: "txsHash",
      length: 32,
      default: Buffer.alloc(32)
    }, {
      name: "number",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "timestamp",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "data",
      length: 32,
      alias: "input",
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }];

    utils.defineProperties(this, fields, data);
  }

  /**
   * Validates the entire block header
   * @param {Block} parentBlock
   * @return {Object}
   * @prop {Boolean} state
   * @prop {String} msg
   */
  validate(parentBlock)
  {
    assert(parentBlock instanceof this.blockClass || parentBlock === undefined, `Block Header validate, parentBlock should be an BLock or undefined, now is ${typeof parentBlock}`);

    // geneies block, no not need check
    if(this.isGenesis())
    {
      return {
        state: true
      };
    }

    let errors = [];

    // check block number
    if(new BN(this.number).cmp(new BN(parentBlock.header.number).addn(1)) !== 0)
    {
      errors.push(`property number should bigger than ${parentBlock.header.number.toString("hex")}, now is ${this.number.toString("hex")}`);
    }

    // check block timestamp
    if(new BN(this.timestamp).cmp(new BN(parentBlock.header.timestamp)) <= 0)
    {
      errors.push(`property timestamp should bigger than ${parentBlock.header.timestamp.toString("hex")}, now is ${this.timestamp.toString("hex")}`);
    }

    // check parentHash
    if(this.parentHash.toString("hex") !== parentBlock.hash().toString("hex"))
    {
      errors.push(`property parentHash should equal to ${parentBlock.hash().toString("hex")}, now is ${this.parentHash.toString("hex")}`);
    }

    return {
      state: errors.length ? false : true,
      msg: `header validate failed, ${errors.join(", ")}`
    }
  }

  /**
   * Returns the sha256 of the blockheader
   * @method hash
   * @return {Buffer}
   */
  hash()
  {
    return sha256(this.serialize());
  }

  isGenesis()
  {
    return this.parentHash.toString("hex") === "0000000000000000000000000000000000000000000000000000000000000000";
  }
}

module.exports = BlockHeader;