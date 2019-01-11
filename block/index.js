const util = require("../util")
const Tx = require("../transaction")
const Trie = require("merkle-patricia-tree")
const BN = util.BN
const rlp = util.rlp
const async = require("async")
const BlockHeader = require("./header")

/**
 * Creates a new block object
 *
 * @class
 * @constructor the raw serialized or the deserialized block.
 * @param {Array|Buffer|Object} data
 * @param {Array} opts Options
 * @param {String|Number} opts.chain The chain for the block [default: 'mainnet']
 * @param {String} opts.hardfork Hardfork for the block [default: null, block number-based behaviour]
 * @param {Object} opts.common Alternatively pass a Common instance (ethereumjs-common) instead of setting chain/hardfork directly
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


    let rawTransactions;

    // if data is a buffer, transfer it to an array like [[], [], []]
    if(Buffer.isBuffer(data))
    {
      data = rlp.decode(data);
    }

    if(Array.isArray(data))
    {
      // data is an array, init block's blockHeader and raw data
      this.header = new BlockHeader(data[0]);
      rawTransactions = data[1];
    }
    else
    {
      // data is an object, only init blockHeader
      this.header = new BlockHeader(data.header);
      rawTransactions = data.transactions || [];
    }

    // parse transactions
    for(i = 0; i < rawTransactions.length; i++)
    {
      let tx = new Tx(rawTransactions[i]);
      this.transactions.push(tx);
    }

    // init raw
    Object.defineProperty(this, "raw", {
      get: function() 
      {
        return this.serialize(false)
      }
    });
    this.raw = [this.header.raw, []];
    this.transactions.forEach(function(tx) {
      raw[1].push(tx.raw);
    })
  }


/**
 * Produces a hash the RLP of the block
 * @method hash
 */
function hash()
{
  return this.header.hash();
}

/**
 * Determines if a given block is the genesis block
 * @method isGenisis
 * @return Boolean
 */
function isGenesis()
{
  return this.header.isGenesis()
}

/**
 * Produces a serialization of the block.
 * @return {Buffer}
 */
function serialize()
{
  return rlp.encode(this.raw);
}

/**
 * Generate transaction trie. The tx trie must be generated before the transaction trie can
 * be validated with `validateTransactionTrie`
 * @method genTxTrie
 * @param {Function} cb the callback
 */
function genTxTrie(cb)
{
  let i = 0;
  let self = this;

  async.eachSeries(self.transactions, function (tx, done) {
    self.txTrie.put(rlp.encode(i), tx.serialize(), done);
    i++;
  }, cb);
}

/**
 * Validates the transaction trie
 * @method validateTransactionTrie
 * @return {Boolean}
 */
function validateTransactionsTrie()
{
  let txT = this.header.transactionsTrie.toString("hex");
  if(this.transactions.length)
  {
    return txT === this.txTrie.root.toString("hex")
  }
  else 
  {
    return txT === util.SHA3_RLP.toString("hex")
  }
}

/**
 * Validates the transactions
 * @method validateTransactions
 * @param {Boolean} [stringError=false] whether to return a string with a dscription of why the validation failed or return a Bloolean
 * @return {Boolean|String}
 */
function validateTransactions(stringError)
{
  let errors = [];

  this.transactions.forEach(function(tx, i) {
    let error = tx.validate(true);
    if(error)
    {
      errors.push("class Block validateTransactions, " + error + " at tx " + i);
    }
  });

  if (stringError === undefined || stringError === false)
  {
    return errors.length === 0;
  }
  else
  {
    return arrayToString(errors);
  }
}

/**
 * Validates the entire block. Returns a string to the callback if block is invalid
 * @method validate
 * @param {BlockChain} blockChain the blockchain that this block wants to be part of
 * @param {Function} cb the callback which is given a String if the block is not valid
 */
function validate(blockChain, cb)
{
  let self = this;
  let errors = [];

  async.parallel([
    // validate block
    self.header.validate.bind(self.header, blockChain),
    // generate the transaction trie
    self.genTxTrie.bind(self)
  ], function(err) {
    if(err)
    {
      errors.push(err);
    }

    if(!self.validateTransactionsTrie())
    {
      errors.push("class Block, invalid transaction true");
    }

    let txErrors = self.validateTransactions(true);
    if (txErrors !== "")
    {
      errors.push(txErrors);
    }

    cb(arrayToString(errors));
  })
}

function arrayToString(array)
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