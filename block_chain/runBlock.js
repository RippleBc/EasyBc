const util = require("../utils")
const Trie = require("merkle-patricia-tree/secure")
const async = require("async")
const initDb = require("../db")

const rlp = util.rlp;
const BN = util.BN;
const Buffer = util.Buffer;

/**
 * process the transaction in a block
 * @param opts
 * @param opts.block {Block} the block we are processing
 * @param opts.root {Buffer|String} the parent block stateRoot
 * @param opts.generate {Boolean} [gen=false] whether to generate the stateRoot
 * @param opts.skipNonce {Boolean} if ignore transaction nonce check
 * @param opts.skipBalance {Boolean} if ignore transaction balance check
 * @param cb {Function} the callback which is given arguments errString, errCode and failedTransactions
 */
module.exports = function(opts, cb) {
  // errCode
  // 0 indicate transaction process err
  // 1 indicate populateCache err
  // 2 indicate processTransactions err
  // 3 indicate validateStateRoot err
  // 4 indicate trie.commit err
  const self = this;

  const block = opts.block;
  const ifGenerateStateRoot = !!opts.generate;
  const validateStateRoot = !ifGenerateStateRoot;

  let failedTransactions = [];
  let failedTransactionsError = [];

  if(opts.root)
  {
    let db = initDb();
    self.stateManager.trie = new Trie(db, opts.root);
  }

  async.series([
    populateCache,
    processTransactions
  ], parseBlockResults);

  function populateCache(cb)
  {
    var accounts = new Set();
    block.transactions.forEach(function(tx) {
      accounts.add(tx.getSenderAddress());
      accounts.add(tx.to);
    });

    self.populateCache(accounts, function(err) {
      if(!!err)
      {
        return cb(err, self.POPULATE_CACHE_ERR);
      }
      cb();
    });
  }

  function processTransactions(cb)
  {
    var validReceiptCount = 0

    if(block.transactions.length > util.bufferToInt(block.header.transactionSizeLimit))
    {
      return cb("runBlock, transaction size is bigger than the the limit of block", self.TX_SIZE_ERR);
    }

    async.eachSeries(block.transactions, function(tx, cb) {
      self.runTx({
        tx: tx,
        block: block,
        skipNonce: opts.skipNonce,
        skipBalance: opts.skipBalance
      }, function(err) {
        if(!!err)
        {
          failedTransactionsError.push(err);
          failedTransactions.push(tx);
        }
        cb()
      });
    }, cb);
  }

  function parseBlockResults(err, errCode)
  {
    if(!!err)
    {
      return cb(err, errCode);
    }
    if(ifGenerateStateRoot)
    {
      block.header.stateRoot = self.stateManager.trie.root;
    }
    self.stateManager.checkpoint();

    async.waterfall([
      function(cb) {
        self.stateManager.cache.flush(function() {
          if(validateStateRoot && self.stateManager.trie.root.toString("hex") !== block.header.stateRoot.toString("hex")) {
            return cb("runBlock, invalid block stateRoot", self.TRIE_STATE_ERR);
          }
          cb();
        })
      },
      function(cb) {
        self.stateManager.commit(function(err) {
          if(!!err)
          {
            return cb("runBlock, commit err, " + err, self.TRIE_COMMIT_ERR)
          }
          cb();
        });
      },
      function(cb) {
        self.stateManager.cache.clear();
        cb();
      }], function(err, errCode) {
        if(!!err)
        {
          self.stateManager.revert(function(err) {
            if(!!err)
            {
              return cb("runBlock, revert err, " + err, self.TRIE_REVERT_ERR);
            }
            return cb(err, errCode);
          });
          return;
        }

        if(failedTransactions.length === 0)
        {
          return cb();
        }
       
        return cb("runBlock, some transactions is invalid, " + failedTransactionsError.toString(), self.TX_PROCESS_ERR, failedTransactions);
      });
  }
}
