const Trie = require("merkle-patricia-tree/secure.js")
const async = require("async")
const Account = require("../../account")
const Cache = require("./cache.js")
const util = require("../../util")

const BN = util.BN;
const rlp = util.rlp;
const Buffer = util.Buffer;

function StateManager (opts = {}) {
  var self = this

  // 指定blockChain
  self.blockchain = opts.blockchain;

  self.trie = opts.trie || new Trie();

  // 指定common，默认是mainnet和chainstart
  var common = opts.common
  if (!common) {
    common = new Common('mainnet', 'chainstart')
  }
  self._common = common

  // the storage trie cache
  self._storageTries = {};
  // the state trie cache
  self.cache = new Cache(self.trie);
  // 记录transaction涉及到account的address
  self._touched = new Set();
}

var proto = StateManager.prototype

/**
 * @param {Buffer} address
 */
getAccount(address, cb)
{
  this.cache.getOrLoad(address, cb);
}


/**
 * @param {Buffer} address
 */
exists(address, cb) {
  this.cache.getOrLoad(address, function(err, account) {
    cb(err, account.exists);
  })
}

/**
 * @param {Buffer} address
 * @param {Account} account
 */
putAccount(address, account, cb)
{
  this.cache.put(address, account);
  this._touched.add(address.toString("hex"));
  cb()
}

/**
 * @param {Buffer} address
 */
getAccountBalance(address, cb)
{
  this.getAccount(address, function(err, account) {
    if (err) {
      return cb(err)
    }
    cb(null, account.balance);
  })
}

putAccountBalance(address, balance, cb)
{
  const self = this;

  self.getAccount(address, function(err, account) {
    if(err)
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

proto.getBlockHash = function(number, cb)
{
  var self = this
  self.blockchain.getBlock(number, function(err, block) {
    if(err)
    {
      return cb(err)
    }
    var blockHash = block.hash();
    cb(null, blockHash);
  })
}


proto.checkpoint = function()
{
  var self = this;
  self.trie.checkpoint();
  self.cache.checkpoint();
}

proto.commit = function(cb)
{
  var self = this
  // setup trie checkpointing
  self.trie.commit(function () {
    // setup cache checkpointing
    self.cache.commit()
    cb()
  })
}

proto.revert = function (cb)
{
  var self = this
  // setup trie checkpointing
  self.trie.revert()
  // setup cache checkpointing
  self.cache.revert()
  cb()
}

// 将address对应的account放入缓存中
proto.warmCache = function (addresses, cb)
{
  this.cache.warm(addresses, cb)
}

// 检查address对应的account是否为空账号
proto.accountIsEmpty = function (address, cb) {
  var self = this
  self.getAccount(address, function (err, account) {
    if (err) {
      return cb(err)
    }
    // 空账号的判定条件（nonce = '' && balance = '' && codeHash = util.SHA3_NULL_S（对null进行sha3操作得到的值））
    cb(null, account.nonce.toString('hex') === '' && account.balance.toString('hex') === '' && account.codeHash.toString('hex') === util.SHA3_NULL_S)
  })
}

proto.cleanupTouchedAccounts = function (cb) {
  var self = this
  // 遍历修改过的account对应的address
  var touchedArray = Array.from(self._touched)
  async.forEach(touchedArray, function (addressHex, next) {
    var address = Buffer.from(addressHex, 'hex')
    // 检查address对应的account是否为空
    // nonce为空，并且balance为空，并且codeHash为空（account是没有进行过任何操作的普通账号）
    self.accountIsEmpty(address, function (err, empty) {
      if (err) {
        next(err)
        return
      }
      // 如果是空账号，删除
      if (empty) {
        self.cache.del(address)
      }
      next(null)
    })
  },
  function () {
    // 清空账号记录
    self._touched.clear()
    cb()
  })
}

module.exports = StateManager;