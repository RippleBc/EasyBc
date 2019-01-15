const util = require("../../utils")
const Trie = require("merkle-patricia-tree/secure")
const async = require("async")
const initDb = require("../../db")

const rlp = util.rlp;
const BN = util.BN;
const Buffer = util.Buffer;
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
  const ifGenerateStateRoot = !!opts.generate;
  const validateStateRoot = !ifGenerateStateRoot;

  var txResults = [];
  var result;

  if(opts.root)
  {
    let db = initDb();
    self.stateManager.trie = new Trie(db, opts.root);
  }

  // create a check point
  self.stateManager.trie.checkpoint();

  async.series([
    populateCache,
    processTransactions
  ], )

  function populateCache(cb)
  {
    var accounts = new Set();
    block.transactions.forEach(function(tx) {
      accounts.add(tx.getSenderAddress().toString("hex"));
      accounts.add(tx.to.toString("hex"));
    });

    self.populateCache(accounts, cb);
  }

  /**
   * Processes all of the transaction in the block
   * @method processTransaction
   * @param {Function} cb the callback is given error if there are any
   */
  function processTransactions(cb)
  {
    var validReceiptCount = 0

    if(block.transactions.length > util.bufferToInt(block.header.transactionSizeLimit))
    {
      return cb(new Error("runBlock, transaction size is bigger than the the limit of block"));
    }

    async.eachSeries(block.transactions, processTx, cb);

    function processTx(tx, cb)
    {

      self.runTx({
        tx: tx,
        block: block,
      }, parseTxResult)

      function parseTxResult(err) {
        txResults.push(result);

        // abort if error
        if (err) {
          receipts.push(null)
          cb(err)
          return
        }
        cb()
      }
    }
  }

  // handle results or error from block run
  function parseBlockResults(err)
  {
    if(err)
    {
      self.stateManager.trie.revert();
      cb(err);
      return
    }

    if(ifGenerateStateRoot)
    {
      block.header.stateRoot = self.stateManager.trie.root;
    }

    async.waterfall([
      function(cb) {
        self.stateManager.cache.flush(function() {
          if(validateStateRoot && self.stateManager.trie.root.toString("hex") !== block.header.stateRoot.toString("hex")) {
            return cb(new Error((err || "") + "runBlock, invalid block stateRoot"));
          }
          cb();
        })
      },
      function(cb) {
        self.stateManager.trie.commit(function() {
          cb();
        })
      }], cb);
  }
}
