const Trie = require("merkle-patricia-tree/secure.js")
const async = require("async")
const Account = require("../account")
const Cache = require("./cache.js")
const util = require("../utils")
const initDb = require("../db")

const BN = util.BN;
const rlp = util.rlp;
const Buffer = util.Buffer;

/**
  * Create a state manager object
  *
  * @class
  * @constructor
  * @param {Trie} opts.trie
  * @param {BlockChain} opts.blockchain
  */
class StateManager
{
  constructor(opts)
  {
    opts = opts || {};

    const self = this;

    this.blockchain = opts.blockchain;

    let db = initDb();
    this.trie = opts.trie || new Trie(db);

    this.cache = new Cache(this.trie);
  }

  /**
   * @param {Buffer} address
   */
  exists(address, cb)
  {
    address = util.toBuffer(address);

    this.cache.getOrLoad(address, function(err, account) {
      if(!!err)
      {
        return cb(err);
      }

      cb(err, account.exists);
    })
  }

  /**
   * @param {Buffer} address
   */
  getAccount(address, cb)
  {
    address = util.toBuffer(address);

    this.cache.getOrLoad(address, cb);
  }

  /**
   * @param {Buffer} address
   * @param {Account} account
   */
  putAccount(address, account, cb)
  {
    address = util.toBuffer(address);

    this.cache.put(address, account);
    cb();
  }

  /**
   * @param {Buffer} address
   * @return cb a function which is given the arguments err and {Buffer}balance
   */
  getAccountBalance(address, cb)
  {
    address = util.toBuffer(address);

    this.getAccount(address, function(err, account) {
      if(!!err)
      {
        return cb(err);
      }

      cb(null, account.balance);
    })
  }

  /**
   * @param {Buffer} address
   * @param {Buffer} balance
   */
  putAccountBalance(address, balance, cb)
  {
    address = util.toBuffer(address);
    balance = util.toBuffer(balance);

    const self = this;

    self.getAccount(address, function(err, account) {
      if(!!err)
      {
        return cb(err);
      }

      if((new BN(balance)).isZero() && !account.exists)
      {
        return cb(null);
      }

      account.balance = balance;
      self.putAccount(address, account, cb);
    })
  }

  checkpoint()
  {
    this.trie.checkpoint();
  }

  commit(cb)
  {
    this.trie.commit(function(err) {
      if(!!err)
      {
        return cb(err);
      }

      cb();
    });
  }

  revert(cb)
  {
    this.trie.revert(function(err) {
      if(!!err)
      {
        return cb(err);
      }
      
      cb();
    });
  }

  /**
    * @param {Array} addresses the type of array item is string
    */
  warmCache(addresses, cb)
  {
    this.cache.warm(addresses, cb);
  }
}
module.exports = StateManager;