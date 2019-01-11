const Buffer = require('safe-buffer').Buffer
const Trie = require('merkle-patricia-tree/secure.js')
const Common = require('../../common')
const genesisStates = require('../../common/genesisStates')
const async = require('async')
const Account = require('../../account')
const Cache = require('./cache.js')
const util = require('../../util')
const BN = util.BN
const rlp = util.rlp

module.exports = StateManager

function StateManager (opts = {}) {
  var self = this

  // 指定blockChain
  self.blockchain = opts.blockchain
  // 记录了账号信息，账号对应的stateRoot（记录账号信息（余额，nonce，codeHash），stateRoot（记录合约变量（storage），合约代码（code）））
  self.trie = opts.trie || new Trie()

  // 指定common，默认是mainnet和chainstart
  var common = opts.common
  if (!common) {
    common = new Common('mainnet', 'chainstart')
  }
  self._common = common

  // the storage trie cache
  self._storageTries = {} 
  // the state trie cache
  self.cache = new Cache(self.trie)
  // 记录transaction涉及到account的address
  self._touched = new Set()
}

var proto = StateManager.prototype

// 返回一个stageManager的备份
proto.copy = function () {
  return new StateManager({ trie: this.trie.copy(), blockchain: this.blockchain })
}

// 从缓存或者this.tire中获取address对应的account
proto.getAccount = function (address, cb) {
  this.cache.getOrLoad(address, cb)
}

// 检查address对应的account是否存在
proto.exists = function (address, cb) {
  this.cache.getOrLoad(address, function (err, account) {
    cb(err, account.exists)
  })
}

// 将address -> account放入缓存中（一切顺利的情况下address -> account会被放入this.trie中）
proto.putAccount = function (address, account, cb) {
  var self = this
  self.cache.put(address, account)
  self._touched.add(address.toString('hex'))
  cb()
}

// 获取address对应的account（可能是一个新创建的account，余额为0）的余额
proto.getAccountBalance = function (address, cb) {
  var self = this
  self.getAccount(address, function (err, account) {
    if (err) {
      return cb(err)
    }
    cb(null, account.balance)
  })
}

// 修改address对应的account的balance属性
proto.putAccountBalance = function (address, balance, cb) {
  var self = this

  self.getAccount(address, function (err, account) {
    if (err) {
      return cb(err)
    }

    if ((new BN(balance)).isZero() && !account.exists) {
      return cb(null)
    }

    account.balance = balance
    self.putAccount(address, account, cb)
  })
}

// 修改address对应的account的code属性（codeHash -> code），放入缓存中（其中code必须经过rlp序列化）
proto.putContractCode = function (address, value, cb) {
  var self = this
  self.getAccount(address, function (err, account) {
    if (err) {
      return cb(err)
    }
    account.setCode(self.trie, value, function (err) {
      if (err) {
        return cb(err)
      }
      self.putAccount(address, account, cb)
    })
  })
}

// 根据address获取对应的code（合约账户拥有code属性）
proto.getContractCode = function (address, cb) {
  var self = this
  self.getAccount(address, function (err, account) {
    if (err) {
      return cb(err)
    }
    account.getCode(self.trie, cb)
  })
}

// 根据当前stateTrie（this.trie）初始化一个 root = account.stateRoot（address对应的account）的tire tree
proto._lookupStorageTrie = function (address, cb) {
  var self = this
  // from state trie
  self.getAccount(address, function (err, account) {
    if (err) {
      return cb(err)
    }
    var storageTrie = self.trie.copy()
    storageTrie.root = account.stateRoot
    // 清空revision record
    storageTrie._checkpoints = []
    cb(null, storageTrie)
  })
}

// 根据address获取相应的stateTrie，如果缓存中（this._storageTries）不存在，根据当前stateTrie创建一个
proto._getStorageTrie = function (address, cb) {
  var self = this
  // 从缓存中获取address对应的stateTrie
  var storageTrie = self._storageTries[address.toString('hex')]
  if (storageTrie) {
    return cb(null, storageTrie)
  }
  // 从数据库中获取address对应的account的stateTrie
  self._lookupStorageTrie(address, cb)
}


// 根据address获取对应的stateTrie，然后通过stateTrie获取key对应的val
proto.getContractStorage = function (address, key, cb) {
  var self = this
  self._getStorageTrie(address, function (err, trie) {
    if (err) {
      return cb(err)
    }
    trie.get(key, function (err, value) {
      if (err) {
        return cb(err)
      }
      var decoded = rlp.decode(value)
      cb(null, decoded)
    })
  })
}

proto._modifyContractStorage = function (address, modifyTrie, cb) {
  var self = this
  // 获取address对应的account所对应的stateTrie
  self._getStorageTrie(address, function (err, storageTrie) {
    if (err) {
      return cb(err)
    }

    // 对storageTrie进行操作（增删改0
    modifyTrie(storageTrie, finalize)

    function finalize (err) {
      if (err) return cb(err)
      // 更新account对应的stateTrie
      self._storageTries[address.toString('hex')] = storageTrie
      // 更新缓存中(this.cache)address对应的account的stateRoot值
      var contract = self.cache.get(address)
      contract.stateRoot = storageTrie.root
      // 更新address对应的account（contract）
      self.putAccount(address, contract, cb)
    }
  })
}

proto.putContractStorage = function (address, key, value, cb) {
  var self = this
  self._modifyContractStorage(address, function (storageTrie, done) {
    if (value && value.length) {
      // 对value进行序列化操作
      var encodedValue = rlp.encode(value)
      // 将key -> encodedValue记录到address对应的account的stateTrie中
      storageTrie.put(key, encodedValue, done)
    } else {
      // 从address对应的account的stateTrie中删除key所对应的数据
      storageTrie.del(key, done)
    }
  }, cb)
}

// 清空address对应的account的stateTrie（root进行一个操作，并不会对底层数据产生任何影响）
proto.clearContractStorage = function (address, cb) {
  var self = this
  self._modifyContractStorage(address, function (storageTrie, done) {
    storageTrie.root = storageTrie.EMPTY_TRIE_ROOT
    done()
  }, cb)
}

// 获取所有缓存的account对应的stateTrie（所有缓存过的account对应的stateTrie，都有可能对stateTrie进行修改）
proto.commitContracts = function (cb) {
  var self = this
  async.each(Object.keys(self._storageTries), function (address, cb) {
    var trie = self._storageTries[address]
    // 清空缓存
    delete self._storageTries[address]
    // 对account对应的stateTrie进行了修改，需要提交修改到底层数据库
    if (trie.isCheckpoint) {
      trie.commit(cb)
    } else {
      cb()
    }
  }, cb)
}

// 回退合约所有操作（stateTrie缓存清空，account对应的address（对stateTrie进行了修改））
proto.revertContracts = function () {
  var self = this
  self._storageTries = {}
  self._touched.clear()
}

proto.getBlockHash = function (number, cb) {
  var self = this
  self.blockchain.getBlock(number, function (err, block) {
    if (err) {
      return cb(err)
    }
    var blockHash = block.hash()
    cb(null, blockHash)
  })
}


proto.checkpoint = function () {
  var self = this
  self.trie.checkpoint()
  self.cache.checkpoint()
}

proto.commit = function (cb) {
  var self = this
  // setup trie checkpointing
  self.trie.commit(function () {
    // setup cache checkpointing
    self.cache.commit()
    cb()
  })
}

proto.revert = function (cb) {
  var self = this
  // setup trie checkpointing
  self.trie.revert()
  // setup cache checkpointing
  self.cache.revert()
  cb()
}

// 将address对应的account放入缓存中
proto.warmCache = function (addresses, cb) {
  this.cache.warm(addresses, cb)
}

// 初始化一个创世区块的stateTrie
proto.generateCanonicalGenesis = function (cb) {
  var self = this
  // 获取创世区块的stateRoot
  const root = self._common.genesis().stateRoot
  // 检查数据库中是否root对应的stateTrie
  self.trie.checkRoot(root, (err, genesis) => {
    if (!genesis && !err) {
      // 不存在则初始化一个
      let initState = genesisStates[self._common.chainName()]
      // 获取需要在创世区块中初始化的account的address
      var addresses = Object.keys(initState)
      async.eachSeries(addresses, function (address, done) {
        // 初始化account的balance属性
        var account = new Account()
        account.balance = new BN(initState[address]).toArrayLike(Buffer)
        // 将account放入stateTrie中
        address = Buffer.from(address, 'hex')
        self.trie.put(address, account.serialize(), done)
      }, cb)
    } else {
      cb(err)
    }
  })
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
