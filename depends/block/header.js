const util = require("../utils")

const BN = util.BN;
const Buffer = util.Buffer;

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
      name: "transactionsTrie",
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
    }, {
      name: "nonce",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }];

    util.defineProperties(this, fields, data);
  }

  /**
   * Validates the entire block header
   * @method validate
   * @param {Blockchain} blockChain the blockchain that this block is validating against
   * @param {Function} cb the callback function. The callback is given an error if the block is invalid
   */
  validate(blockchain, cb)
  {
    const self = this;

    let bnZero = new BN(0);

    // geneies block, no not need check
    if(this.isGenesis())
    {
      return cb();
    }

    // find the blocks parent
    blockchain.getBlockByHash(self.parentHash, function(err, parentBlock)
    {
      if(!!err)
      {
        return cb("class Block validate, could not find parent block.");
      }

      self.parentBlock = parentBlock;

      // check block number
      var number = new BN(self.number);
      if(number.cmp(new BN(parentBlock.header.number).iaddn(1)) !== 0)
      {
        return cb("class Block validate, invalid number");
      }

      // check block timestamp
      if(util.bufferToInt(self.timestamp) <= util.bufferToInt(parentBlock.header.timestamp))
      {
        return cb("class Block validate, invalid timestamp");
      }

      cb();
    });
  }

  /**
   * Returns the sha3 hash of the blockheader
   * @method hash
   * @return {Buffer}
   */
  hash()
  {
    let rlpEncodedText = this.serialize();
    return util.keccak256(rlpEncodedText);
  }

  isGenesis()
  {
    return this.parentHash.toString("hex") === "0000000000000000000000000000000000000000000000000000000000000000";
  }
}

module.exports = BlockHeader;