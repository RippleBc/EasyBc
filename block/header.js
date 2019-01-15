const util = require("../utils")

const BN = util.BN;
const Buffer = util.Buffer;

/**
 * Creates a new BlockHeader object
 *
 * @class
 * @param {Buffer | Array | Object} data
 * @prop {Buffer} parentHash the blocks' parent's hash
 * @prop {Buffer} stateRoot The root of Trie containing the account info
 * @prop {Buffer} transactionTrie the root of a Trie containing the transactions
 * @prop {Buffer} timestamp
 * @prop {Buffer} extraData
 * @prop {Array.<Buffer>} raw an array of buffers containing the raw blocks.
 */
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
      default: utils.SHA3_RLP
    }, {
      name: "number",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(32)
    }, {
      name: "timestamp",
      default: Buffer.alloc(0)
    }, {
      name: "extraData",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "nonce",
      length: 32,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "transactionSizeLimit",
      length: 2,
      allowLess: true,
      default: util.intToBuffer(50)
    }];

    utils.defineProperties(this, fields, data);
  }

  /**
   * Validates the entire block header
   * @method validate
   * @param {Blockchain} blockChain the blockchain that this block is validating against
   * @param {Function} cb the callback function. The callback is given an error if the block is invalid
   */
  validate(blockchain, cb)
  {
    // geneies block, no not need check
    if()
    {
      cb();
    }


    // find the blocks parent
    blockchain.getBlock(self.parentHash, function(err, parentBlock)
    {
      if(err)
      {
        return cb("class Block validate, could not find parent block");
      }

      self.parentBlock = parentBlock;

      // check block number
      var number = new BN(self.number);
      if(number.cmp(new BN(parentBlock.header.number).iaddn(1)) !== 0)
      {
        return cb("class Block validate, invalid number");
      }

      // check block timestamp
      if(utils.bufferToInt(self.timestamp) <= utils.bufferToInt(parentBlock.header.timestamp))
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
    return utils.keccak256(rlpEncodedText);
  }

  isGenesis()
  {
    return this.parentHash.toString("hex") === "";
  }
}

module.exports = BlockHeader;