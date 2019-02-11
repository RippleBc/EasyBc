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
  const self = this;

  const block = opts.block;
  const ifGenerateStateRoot = !!opts.generate;
  const validateStateRoot = !ifGenerateStateRoot;

  let failedTransactions = [];

  if(opts.root)
  {
    self.stateManager.trie = new Trie(opts.root);
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
        throw new Error(`runBlock populateCache ${err}`);
      }
      cb();
    });
  }

  function processTransactions(cb)
  {
    var validReceiptCount = 0

    async.eachSeries(block.transactions, function(tx, cb) {
      self.runTx({
        tx: tx,
        block: block,
        skipNonce: opts.skipNonce,
        skipBalance: opts.skipBalance
      }, function(err) {
        if(!!err)
        {
          // record failed transaction
          failedTransactions.push(tx);
        }
        cb()
      });
    }, cb);
  }

  function parseBlockResults()
  {
    if(failedTransactions.length > 0)
    {
      return cb("runBlock, some transactions is invalid", failedTransactions);
    }

    if(ifGenerateStateRoot)
    {
      console.log("11111111111111111111111111111111111111111111111111111111111: " + util.baToHexString(self.stateManager.trie.root))
      block.header.stateRoot = self.stateManager.trie.root;
    }

    self.stateManager.checkpoint();

    async.waterfall([
      function(cb) {
        self.stateManager.cache.flush(function(err) {
          if(!!err)
          {
            throw new Error(`runBlock, flush ${err}`);
          }

          // check state trie
          if(validateStateRoot && self.stateManager.trie.root.toString("hex") !== block.header.stateRoot.toString("hex"))
          {
            throw new Error(`runBlock, state trie err, computed stateTrie: ${self.stateManager.trie.root.toString("hex")}, block stateTrie: ${block.header.stateRoot.toString("hex")}`);
          }

          cb();
        })
      },
      function(cb) {
        self.stateManager.commit(function(err) {
          if(!!err)
          {
            throw new Error(`runBlock, commit ${err}`);
          }

          self.stateManager.cache.clear();

          cb();
        });
      }], function() {
        cb();
      });
  }
}
