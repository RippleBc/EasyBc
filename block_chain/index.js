const util = require("util")
const ebUtil = require("../../util")
const StateManager = require("./stateManager.js")
const AsyncEventEmitter = require("async-eventemitter")
const Block = require("../block")
const initDb = require("../db")
const async = require("async")

const BN = ebUtil.BN;
const Buffer = ebUtil.Buffer;

const maxBlockNumberKey = util.toBuffer("maxBlockNumberKey");

/**
 * @constructor
 * @param {Trie} opts.stateTrie A merkle-patricia-tree instance for the state tree
 */
function BlockChain(opts)
{
  opts = opts || {};

  this.stateManager = new StateManager({
    trie: opts.stateTrie,
    blockChain: this
  })

  AsyncEventEmitter.call(this);
}

util.inherits(BlockChain, AsyncEventEmitter);

BlockChain.prototype.runBlockchain = require("./runBlockchain.js");
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

  hash = util.toBuffer(hash);

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
  async.waterfall([
    function(cb) {
      this.getBlockHashByNumber(number, cb)
    },
    function(hash, cb) {
      if(hash === null)
      {
        return cb(`BlockChain getBlockByNumber, block, number: ${number.toString("hex")} not exist`);
      }
      this.getBlockByHash(hash, cb);
    }], cb);
}

/**
 * @param {*} hash
 */
BlockChain.prototype.delBlockByHash = function(hash, cb)
{
  const db = initDb();

  hash = util.toBuffer(hash);

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
  async.waterfall([
    function(cb) {
      this.getBlockHashByNumber(number, cb)
    },
    function(hash, cb) {
      if(hash === null)
      {
        return cb(`BlockChain delBlockByNumber, block, number: ${number.toString("hex")} not exist`);
      }
      this.delBlockByHash(hash, cb);
    }], cb);
}

/**
 * @param {Block} block
 */
BlockChain.prototype.updateBlock = function(block, cb)
{
  const db = initDb();

  const blockHash = block.hash();
  const number = block.number;

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
Block.prototype.putBlock = function(block, cb)
{
  let db = initDb();

  async.waterfall([
    function(cb) {
      db.get(maxBlockNumberKey, function(err, number) {
        if(!!err)
        {
          if(err.notFound)
          {
            cb(null, util.toBuffer(0));
          }
          return cb(err);
        }
        
        cb(null, number);
      });
    },
    function(number, cb) {
      block.number = new BN(number).iaddn(1);
      db.put(maxBlockNumberKey, block.number, cb);
    },
    funtion(cb) {
      this.updateBlock(block, cb);
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
Block.prototype.getBlockHashByNumber = function(number, cb)
{
  let db = initDb();

  number = util.toBuffer(number);

  db.get(number, function(err, hash) {
    if(!!err)
    {
      if(err.notFound)
      {
        cb(null, null);
      }
      return cb("BlockChain getBlockHashByNumber, " + err);
    }
    cb(null, hash);
  });
}

module.exports = BlockChain;