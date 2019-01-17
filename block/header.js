const util = require("../utils")

const BN = util.BN;
const Buffer = util.Buffer;

const MAX_TRANSACTION_SIZE =  util.intToBuffer(50);

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
      default: util.SHA3_RLP
    }, {
      name: "number",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "timestamp",
      allowZero: true,
      allowLess: true,
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
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "transactionSizeLimit",
      length: 32,
      allowLess: true,
      default: MAX_TRANSACTION_SIZE
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
    return new util.BN(this.parentHash).eq(new util.BN(0));
  }
}

module.exports = BlockHeader;