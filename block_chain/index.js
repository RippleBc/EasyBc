const util = require("util")
const ebUtil = require("../utils")
const StateManager = require("./stateManager.js")
const AsyncEventEmitter = require("async-eventemitter")
const Block = require("../block")
const initDb = require("../db")
const async = require("async")

const BN = ebUtil.BN;
const Buffer = ebUtil.Buffer;

const maxBlockNumberKey = ebUtil.toBuffer("maxBlockNumberKey");

/**
 * @constructor
 * @param {Trie} opts.stateTrie A merkle-patricia-tree instance for the state tree
 */
function BlockChain(opts)
{
  const self = this;

  opts = opts || {};

  this.stateManager = new StateManager({
    trie: opts.stateTrie,
    blockChain: self
  })

  this.TX_PROCESS_ERR = 0;
  this.POPULATE_CACHE_ERR = 1;
  this.TX_SIZE_ERR = 2;
  this.TRIE_STATE_ERR = 3;
  this.TRIE_COMMIT_ERR = 4;
  this.TRIE_REVERT_ERR = 5;
  AsyncEventEmitter.call(this);
}

util.inherits(BlockChain, AsyncEventEmitter);

BlockChain.prototype.runBlockchain = require("./runBlockChain.js");
BlockChain.prototype.runBlock = require("./runBlock.js");
BlockChain.prototype.runTx = require("./runTx.js");

/**
 * @param {Array} addresses
 */
BlockChain.prototype.populateCache = function(addresses, cb)
{
  this.stateManager.warmCache(addresses, cb);
}


/**
 * @param {*} hash
 */
BlockChain.prototype.getBlockByHash = function(hash, cb) {
  const db = initDb();

  hash = ebUtil.toBuffer(hash);

  db.get(hash, function(err, raw) {
    if(!!err)
    {
      if(err.notFound)
      {
        return cb(`BlockChain getBlockByHash, block, hash: ${hash.toString("hex")} not exist`);
      }
      return cb("BlockChain getBlockByHash, " + err);
    }
    
    cb(null, new Block(raw));
  });
}

/**
 * @param {*} number
 */
BlockChain.prototype.getBlockByNumber = function(number, cb)
{
  const self = this;

  async.waterfall([
    function(cb) {
      self.getBlockHashByNumber(number, cb);
    },
    function(hash, cb) {
      if(hash === null)
      {
        return cb(`BlockChain getBlockByNumber, block, number: ${ebUtil.toBuffer(number).toString("hex")} not exist`);
      }
      self.getBlockByHash(hash, cb);
    }], cb);
}

/**
 * @param {*} hash
 */
BlockChain.prototype.delBlockByHash = function(hash, cb)
{
  const db = initDb();

  hash = ebUtil.toBuffer(hash);

  db.del(hash, function(err) {
    if(!!err)
    {
      return cb("BlockChain delBlockByHash, " + err);
    }
    cb();
  });
}

/**
 * @param {*} number
 */
BlockChain.prototype.delBlockByNumber = function(number, cb)
{
  const self = this;

  async.waterfall([
    function(cb) {
      self.getBlockHashByNumber(number, cb)
    },
    function(hash, cb) {
      if(hash === null)
      {
        return cb(`BlockChain delBlockByNumber, block, number: ${ebUtil.toBuffer(number).toString("hex")} not exist`);
      }
      self.delBlockByHash(hash, cb);
    }], cb);
}

/**
 * @param {Block} block
 */
BlockChain.prototype.updateBlock = function(block, cb)
{
  const db = initDb();

  const blockHash = block.hash();
  const number = block.header.number;

  async.waterfall([
    function(cb) {
      db.put(number, blockHash, cb);
    },
    function(cb) {
      db.put(blockHash, block.serialize(), cb);
    }], function(err) {
      if(!!err)
      {
        return cb("BlockChain updateBlock, " + err);
      }
      cb();
    });
}

/**
 * Add new block to block chain
 * @param {Block} block
 */
BlockChain.prototype.putBlock = function(block, cb)
{
  const self = this;

  let db = initDb();

  async.waterfall([
    function(cb) {
      if(block.header.isGenesis())
      {
        return cb(null, new BN(0));
      }

      db.get(maxBlockNumberKey, function(err, number) {
        if(!!err)
        {
          if(err.notFound)
          {
            return cb(null, new BN(0));
          }
          return cb(err);
        }
        
        cb(null, new BN(number));
      });
    },
    function(number, cb) {
      block.header.number = ebUtil.toBuffer(number.iaddn(1));
      db.put(maxBlockNumberKey, block.header.number, cb);
    },
    function(cb) {
      self.updateBlock(block, cb);
    }], function(err) {
      if(!!err)
      {
        return cb("BlockChain putBlock, " + err);
      }
      cb();
    });
}

/**
 * @param {*} number
 * @return cb a callback function which is given the arguments err - for errors that may have occured and value - the found value in a Buffer or if no value was found null
 */
BlockChain.prototype.getBlockHashByNumber = function(number, cb)
{
  let db = initDb();

  number = ebUtil.toBuffer(number);

  db.get(number, function(err, hash) {
    if(!!err)
    {
      if(err.notFound)
      {
        return cb(null, null);
      }
      return cb("BlockChain getBlockHashByNumber, " + err);
    }
    cb(null, hash);
  });
}

/**
 * Get max block number
 */
BlockChain.prototype.getMaxBlockNumber = function(cb)
{
  let db = initDb();

  db.get(maxBlockNumberKey, function(err, number) {
    if(!!err)
    {
      if(err.notFound)
      {
        return cb(null, new BN(0));
      }
      return cb(err);
    }
    
    cb(null, new BN(number));
  });
}

module.exports = BlockChain;