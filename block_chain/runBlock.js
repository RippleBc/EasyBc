const Buffer = require('safe-buffer').Buffer
const async = require('async')
const util = require('../../util')
const Bloom = require('./bloom.js')
const rlp = util.rlp
const Trie = require('merkle-patricia-tree')
const BN = util.BN

/**
 * process the transaction in a block and pays the miners
 * @param opts
 * @param opts.block {Block} the block we are processing
 * @param opts.generate {Boolean} [gen=false] whether to generate the stateRoot
 * @param cb {Function} the callback which is given an error string
 */
module.exports = function (opts, cb) {
  const self = this

  // block对象
  const block = opts.block 
  // 是否需要生成对应的stateRoot
  const generateStateRoot = !!opts.generate 
  // 是否需要校验stateRoot（处理本地客户端mined区块，则无需进行校验，处理远程客户端的mined区块，需要进行验证）
  const validateStateRoot = !generateStateRoot
  // 初始化一个布隆过滤器
  const bloom = new Bloom()
  // 初始化一个receiptTrie，用来记录transaction receipt
  const receiptTrie = new Trie()
  // 处理当前区块时，消耗的gas
  var gasUsed = new BN(0)
  // miner account
  var minerAccount
  // 记录transction receipt
  var receipts = []
  // 记录transaction的处理结果
  var txResults = []
  var result

  // 表示parentBlock的stateRoot值，如果是genesisRoot，opt.root = null
  if (opts.root) {
    self.stateManager.trie.root = opts.root
  }

  // 设立一个检查点
  self.stateManager.trie.checkpoint()

  // run everything
  async.series([
    beforeBlock,
    populateCache,
    processTransactions
  ], parseBlockResults)

  function beforeBlock (cb) {
    self.emit('beforeBlock', opts.block, cb)
  }

  function afterBlock (cb) {
    self.emit('afterBlock', result, cb)
  }

  // 遍历transactions，将address对应的account放入缓存中
  function populateCache (cb) {
    var accounts = new Set()
    accounts.add(block.header.coinbase.toString('hex'))
    block.transactions.forEach(function (tx) {
      accounts.add(tx.getSenderAddress().toString('hex'))
      accounts.add(tx.to.toString('hex'))
    })

    block.uncleHeaders.forEach(function (uh) {
      accounts.add(uh.coinbase.toString('hex'))
    })

    self.populateCache(accounts, cb)
  }

  /**
   * Processes all of the transaction in the block
   * @method processTransaction
   * @param {Function} cb the callback is given error if there are any
   */
  function processTransactions (cb) {
    var validReceiptCount = 0

    async.eachSeries(block.transactions, processTx, cb)

    function processTx (tx, cb) {
      var gasLimitIsHigherThanBlock = new BN(block.header.gasLimit).lt(new BN(tx.gasLimit).add(gasUsed))
      if (gasLimitIsHigherThanBlock) {
        cb(new Error('tx has a higher gas limit than the block'))
        return
      }

      // run the tx through the VM
      self.runTx({
        tx: tx,
        block: block,
        populateCache: false
      }, parseTxResult)

      function parseTxResult (err, result) {
        txResults.push(result)
        // var receiptResult = new BN(1)

        // abort if error
        if (err) {
          receipts.push(null)
          cb(err)
          return
        }

        gasUsed = gasUsed.add(result.gasUsed)
        // combine blooms via bitwise OR
        bloom.or(result.bloom)

        if (generateStateRoot) {
          block.header.bloom = bloom.bitvector
        }

        // 获取
        var txLogs = result.vm.logs || []

        var rawTxReceipt = [
          result.vm.exception ? 1 : 0, // 0表示VM出现异常，1表示正常
          gasUsed.toArrayLike(Buffer),
          result.bloom.bitvector, // transaction产生的log的布隆过滤器
          txLogs // transaction产生的log
        ]
        var txReceipt = {
          status: rawTxReceipt[0],
          gasUsed: rawTxReceipt[1],
          bitvector: rawTxReceipt[2],
          logs: rawTxReceipt[3]
        }

        receipts.push(txReceipt)
        // 将transaction receipt记录到receiptTrie中
        receiptTrie.put(rlp.encode(validReceiptCount), rlp.encode(rawTxReceipt))
        validReceiptCount++
        cb()
      }
    }
  }

  // handle results or error from block run
  function parseBlockResults (err) {
    if (err) {
      self.stateManager.trie.revert()
      cb(err)
      return
    }

    // 发放区块奖励
    payOmmersAndMiner()

    if (generateStateRoot) {
      block.header.stateRoot = self.stateManager.trie.root
    }

    self.stateManager.trie.commit(function (err) {
      self.stateManager.cache.flush(function () {
        // 校验区块
        if (validateStateRoot) {
          // 校验receiptTrie
          if (receiptTrie.root && receiptTrie.root.toString('hex') !== block.header.receiptTrie.toString('hex')) {
            err = new Error((err || '') + 'invalid receiptTrie ')
          }
          // 校验bloom（快速查找address对应的log）
          if (bloom.bitvector.toString('hex') !== block.header.bloom.toString('hex')) {
            err = new Error((err || '') + 'invalid bloom ')
          }
          // 校验gasUsed
          if (util.bufferToInt(block.header.gasUsed) !== Number(gasUsed)) {
            err = new Error((err || '') + 'invalid gasUsed ')
          }
          // 校验stateRoot（记录账号信息(nonce，余额，codeHash，code，storage))
          if (self.stateManager.trie.root.toString('hex') !== block.header.stateRoot.toString('hex')) {
            err = new Error((err || '') + 'invalid block stateRoot ')
          }
        }

        // 清空缓存
        self.stateManager.cache.clear()

        result = {
          receipts: receipts,
          results: txResults,
          error: err
        }

        afterBlock(cb.bind(this, err, result))
      })
    })
  }

  // 发放区块奖励
  function payOmmersAndMiner () {
    var ommers = block.uncleHeaders
    // 给uncleHeader发放奖励
    ommers.forEach(rewardOmmer)

    // 计算miner奖励
    var minerReward = new BN(self._common.param('pow', 'minerReward'))
    var niblingReward = minerReward.divn(32)
    var totalNiblingReward = niblingReward.muln(ommers.length)
    minerAccount = self.stateManager.cache.get(block.header.coinbase)
    // 修改header.coinBase对应的account的余额，写入缓存中
    minerAccount.balance = new BN(minerAccount.balance)
      .add(minerReward)
      .add(totalNiblingReward)
    self.stateManager.cache.put(block.header.coinbase, minerAccount)
  }

  // 对uncle节点发放奖励
  function rewardOmmer (ommer) {
    // 计算奖励
    var minerReward = new BN(self._common.param('pow', 'minerReward'))
    // uncleHeader不应当与当前的header的高度相差超过8
    var heightDiff = new BN(block.header.number).sub(new BN(ommer.number))
    // uncleHeader与当前header的高度差越小，奖励越多（线性函数）
    var reward = ((new BN(8)).sub(heightDiff)).mul(minerReward.divn(8))

    if (reward.ltn(0)) {
      reward = new BN(0)
    }

    // 修改uncleHeader中coinBase对应的account的余额，放入缓存中
    var ommerAccount = self.stateManager.cache.get(ommer.coinbase)
    ommerAccount.balance = reward.add(new BN(ommerAccount.balance))
    self.stateManager.cache.put(ommer.coinbase, ommerAccount)
  }
}
