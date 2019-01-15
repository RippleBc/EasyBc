const util = require("util")
const ebUtil = require("../../util")
const StateManager = require("./stateManager.js")
const AsyncEventEmitter = require("async-eventemitter")
const initDb = require("../db")

const BN = ebUtil.BN;
const Buffer = ebUtil.Buffer;

/**
 * @constructor
 * @param {Object} [opts]
 * @param ..{Trie} [opts.stateTrie] A merkle-patricia-tree instance for the state tree
 */
function BlockChain(opts)
{
  opts = opts || {};

  this.stateManager = new StateManager({
    trie: opts.stateTrie,
    blockchain: this
  })

  AsyncEventEmitter.call(this);
}

util.inherits(BlockChain, AsyncEventEmitter);

BlockChain.prototype.runBlockchain = require("./runBlockchain.js");
BlockChain.prototype.runBlock = require("./runBlock.js");
BlockChain.prototype.runTx = require("./runTx.js");


BlockChain.prototype.populateCache = function(addresses, cb)
{
  this.stateManager.warmCache(addresses, cb);
}

module.exports = BlockChain;