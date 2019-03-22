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
class BlockChain extends AsyncEventEmitter
{
  constructor(opts)
  {
    super();

    const self = this;

    opts = opts || {};

    this.stateManager = new StateManager({
      trie: opts.stateTrie,
      blockChain: self
    });

    this.runBlockchain = require("./runBlockChain.js");
    this.runBlock = require("./runBlock.js");
    this.runTx = require("./runTx.js");
  }

  /**
   * @param {*} hash
   */
  getBlockByHash(hash, cb) {
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
  getBlockByNumber(number, cb)
  {
    const self = this;

    async.waterfall([
      function(cb) {
        self.getBlockHashByNumber(number, cb);
      },
      function(hash, cb) {
        if(hash === null)
        {
          return cb(null, null);
        }
        self.getBlockByHash(hash, cb);
      }], cb);
  }

  /**
   * @param {*} hash
   */
  delBlockByHash(hash, cb)
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
  delBlockByNumber(number, cb)
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
  updateBlock(block, cb)
  {
    const db = initDb();

    const blockHash = block.hash();
    const number = block.header.number;

    async.waterfall([
      function(cb) {
        db.put(blockHash, block.serialize(), cb);
      },
      function(cb) {
        db.put(number, blockHash, cb);
      }], function(err) {
        if(!!err)
        {
          return cb("BlockChain updateBlock, " + err);
        }
        cb();
      });
  }

  /**
   * @param {*} number
   */
  updateMaxBlockNumber(number, cb)
  {
    let db = initDb();
    
    number = ebUtil.toBuffer(number);

    db.put(maxBlockNumberKey, number, cb);
  }

  /**
   * Add new block to block chain, note!!! this func now is only for test
   * @param {Block} block
   */
  putBlock(block, cb)
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
  getBlockHashByNumber(number, cb)
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
   * @param cb a function with arguments err and {BN}maxBlockNumber
   */
  getLastestBlockNumber(cb)
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

  /**
   * get transaction
   * @param {*} trasactionHash
   */
   getTrasaction(trasactionHash, cb)
   {
      const TRANSACTION_FOUND = 1;
      
      trasactionHash = ebUtil.toBuffer(trasactionHash);
      let transaction;

      const self = this;

      self.getLastestBlockNumber(function(err, bnNumber) {
        if(!!err)
        {
          return cb(err);
        }

        getTransactionTraverse(bnNumber, cb)
      });

      /**
       * @param {Buffer} bnLastestBlockNumber
       * @return {Function} cb 
       */
      function getTransactionTraverse(bnLastestBlockNumber, cb)
      {
        let bnIndex = bnLastestBlockNumber;

        async.whilst(function() {
          return bnIndex.gtn(0);
        }, function(done) {
          getTransaction(bnIndex, function(err, _transaction) {
            bnIndex.isubn(1);

            if(!!err)
            {
              transaction = _transaction;
              return done(err);
            }

            done();
          });
        }, function(err) {
          if(!!err && err === TRANSACTION_FOUND)
          {
            return cb(null, transaction);
          }

          cb(err);
        });
      }

      /**
       * @param {*} blockNumber
       */
      function getTransaction(blockNumber, cb)
      {
        async.waterfall([
          function(cb) {
            self.getBlockByNumber(blockNumber, cb);
          },
          
          function(block, cb) {
            if(block === null)
            {
              return cb();
            }
            let transaction = block.getTransaction(trasactionHash);
            if(transaction)
            {
              return cb(TRANSACTION_FOUND, transaction);
            }
            cb();
          }], cb);
      }
   }

}

module.exports = BlockChain;