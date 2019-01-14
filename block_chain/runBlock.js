const Buffer = require("safe-buffer").Buffer
const async = require("async")
const util = require("../../util")
const Bloom = require("./bloom.js")
const rlp = util.rlp
const Trie = require("merkle-patricia-tree")
const BN = util.BN

/**
 * process the transaction in a block
 * @param opts
 * @param opts.block {Block} the block we are processing
 * @param opts.generate {Boolean} [gen=false] whether to generate the stateRoot
 * @param opts.root {Buffer} the parent block stateRoot
 * @param cb {Function} the callback which is given an error string
 */
module.exports = function(opts, cb) {
  const self = this;

  const block = opts.block;
  const ifGenerateStateRoot = !!opts.generate 
  const validateStateRoot = !ifGenerateStateRoot

  var txResults = []
  var result

  if (opts.root) {
    self.stateManager.trie.root = opts.root
  }

  self.stateManager.trie.checkpoint();

  // run everything
  async.series([
    beforeBlock,
    populateCache,
    processTransactions
  ], parseBlockResults)

  function beforeBlock(cb) {
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

        if (ifGenerateStateRoot) {
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

    if (ifGenerateStateRoot) {
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
}
