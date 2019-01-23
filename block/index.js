const util = require("../utils")
const Tx = require("../transaction")
const Trie = require("merkle-patricia-tree")
const BN = util.BN
const rlp = util.rlp
const async = require("async")
const BlockHeader = require("./header")
const initDb = require("../db")

/**
 * Creates a new block object
 *
 * @class
 * @constructor the raw serialized or the deserialized block.
 * @param {Array|Buffer|Object} data
 * @param {Array} data[0] raw header data 
 * @param {Array} data[1] the item of array is raw transaction data 
 * @prop {Header} header the block's header
 * @prop {Array.<Header>} uncleList an array of uncle headers
 * @prop {Array.<Buffer>} raw an array of buffers containing the raw blocks.
 */
class Block {
  constructor(data)
  {
    data = data || [[], []];

    this.transactions = [];

    this.txTrie = new Trie();

    let rawTransactions = [];

    if(Buffer.isBuffer(data))
    {
      data = rlp.decode(data);
    }

    if(Array.isArray(data))
    {
      this.header = new BlockHeader(data[0]);
      rawTransactions = data[1];
    }
    else
    {
      this.header = new BlockHeader(data.header);
      rawTransactions = data.transactions;
    }

    // parse transactions
    for(let i = 0; i < rawTransactions.length; i++)
    {
      let tx = new Tx(rawTransactions[i]);
      this.transactions.push(tx);
    }
  }


  /**
   * Produces a hash the RLP of the block
   * @method hash
   */
  hash()
  {
    return this.header.hash();
  }

  /**
   * Determines if a given block is the genesis block
   * @method isGenisis
   * @return Boolean
   */
  isGenesis()
  {
    return this.header.isGenesis()
  }

  /**
   * Produces a serialization of the block.
   * @return {Buffer}
   */
  serialize()
  {
    let raw = [[], []];

    raw[0] = this.header.raw;

    for(let i = 0; i < this.transactions.length; i++)
    {
      raw[1].push(this.transactions[i].raw);
    }

    return rlp.encode(raw);
  }

  /**
   * Generate transaction trie. The tx trie must be generated before the transaction trie can
   * be validated with `validateTransactionTrie`
   * @method genTxTrie
   * @param {Function} cb the callback
   */
  genTxTrie(cb)
  {
    let self = this;

    async.eachSeries(self.transactions, function (tx, done) {
      self.txTrie.put(tx.hash(true), tx.serialize(), done);
    }, cb);
  }

  /**
   * Validates the transaction trie
   * @method validateTransactionTrie
   * @return {Boolean}
   */
  validateTransactionsTrie()
  {
    let txT = this.header.transactionsTrie.toString("hex");
    if(this.transactions.length)
    {
      return txT === this.txTrie.root.toString("hex")
    }
   
    return txT === util.SHA3_RLP.toString("hex")
  }

  /**
   * Validates the transactions
   * @method validateTransactions
   * @param {Boolean} [stringError=false] whether to return a string with a dscription of why the validation failed or return a Bloolean
   * @return {Boolean|String}
   */
  validateTransactions(stringError)
  {
    let errors = [];

    this.transactions.forEach(function(tx, i) {
      let error = tx.validate(true);
      if(!!error)
      {
        errors.push("class Block validateTransactions, " + error + " at tx " + i);
      }
    });

    if (stringError === undefined || stringError === false)
    {
      return errors.length === 0;
    }
   
    return this.arrayToString(errors);
  }

  /**
   * Validates the entire block. Returns a string to the callback if block is invalid
   * Checks parent block's hash, timestamp, number and current block's transactionTrieRoot and the valid of transactions
   * @method validate
   * @param {BlockChain} blockChain the blockchain that this block wants to be part of
   * @param {Function} cb the callback which is given arguments result{null|String}
   */
  validate(blockChain, cb)
  {
    let self = this;
    let errors = [];

    async.parallel([
      // validate block
      self.header.validate.bind(self.header, blockChain),
      // generate the transaction trie
      self.genTxTrie.bind(self)
    ], function(err) {
      if(!!err)
      {
        errors.push(err);
      }

      if(!self.validateTransactionsTrie())
      {
        errors.push("class Block, invalid transaction trie");
      }

      let txErrors = self.validateTransactions(true);
      if (txErrors !== "")
      {
        errors.push(txErrors);
      }

      if(errors.length === 0)
      {
        return cb();
      }

      cb(self.arrayToString(errors));
    })
  }

  arrayToString(array)
  {
    try {
      return array.reduce(function(str, err) {
        if(str)
        {
          str += "";
        }
        return str + err;
      })
    }
    catch(e)
    {
      return "";
    }
  }
}
module.exports = Block;