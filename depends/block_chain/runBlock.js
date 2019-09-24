const utils = require("../utils");
const async = require("async");
const assert = require('assert')
const Block = require('../block')

const rlp = utils.rlp;
const BN = utils.BN;
const Buffer = utils.Buffer;
const sha256 = utils.sha256;

/**
 * Process the transactions in an block
 * @param {Object} opts
 * @prop {Block} opts.block - the block we are processing
 * @prop {Buffer} opts.root - the parent block stateRoot
 * @prop {Boolean} opts.generate - whether to generate the stateRoot
 * @prop {Boolean} opts.skipNonce - if ignore transaction nonce check
 * @prop {Boolean} opts.skipBalance - if ignore transaction balance check
 * @return {Object} 
 * @prop {Number} state
 * @prop {String} msg
 * @prop {Array} transactions  
 */
module.exports = async function(opts) {
  assert(opts.block instanceof Block, `runBlock, opts.block should be an Block, now is ${typeof opts.block}`);

  const block = opts.block;
  const ifGenerateTrie = ifGenerateTxsHash = opts.generate || false;
  const validateTrie = !ifGenerateTrie;
  const validateTxsHash = !ifGenerateTxsHash;

  let failedTransactions = [];
  let errors = [];

  if(opts.root)
  {
    await this.stateManager.resetTrieRoot(opts.root);
  }

  // reset receiptManager
  await this.receiptManager.resetTrieRoot(utils.SHA3_RLP);

  // populate cache
  let addresses = [];
  for(let i = 0; i < block.transactions.length; i++)
  {
    let tx = block.transactions[i];

    try
    {
      addresses.push(tx.from);
    }
    catch(e)
    {
      await Promise.reject(`runBlock, trasaction ${tx.hash(true).toString("hex")}'s property from is invalid`);
    }
    addresses.push(tx.to);
  }

  // delete same ele
  addresses = [...new Set(addresses)];

  await this.stateManager.warmCache(addresses);

  await this.receiptManager.checkpoint();

  // process transactions
  for(let i = 0; i < block.transactions.length; i++)
  {
    let transaction = block.transactions[i];
    try
    {
      await this.runTx({
        timestamp: block.header.timestamp,
        tx: transaction,
        skipNonce: opts.skipNonce,
        skipBalance: opts.skipBalance
      });
    }
    catch(e)
    {
      errors.push(e);
      failedTransactions.push(transaction);
    }
  }

  if(failedTransactions.length > 0)
  {
    return {
      state: false,
      msg: `runBlock, some transactions is invalid, ${errors.join(", ")}`,
      transactions: failedTransactions
    };
  }

  // 
  this.stateManager.checkpoint();

  const modifiedAccounts = await this.stateManager.flushCache();

  if(ifGenerateTrie)
  {
    block.header.stateRoot = this.stateManager.getTrieRoot();
    block.header.receiptRoot = this.receiptManager.getTrieRoot();
  }

  // compute txsHash
  const rawTransactionArray = [];
  for (let tx of block.transactions) {
    rawTransactionArray.push(tx.hash());
  }
  const txsHash = sha256(rlp.encode(rawTransactionArray))

  if (ifGenerateTxsHash)
  {
    block.header.txsHash = txsHash;
  }

  // check state trie
  if(validateTrie && this.stateManager.getTrieRoot().toString("hex") !== block.header.stateRoot.toString("hex"))
  {
    await Promise.reject(`runBlock, stateRoot should be ${this.stateManager.getTrieRoot().toString("hex")}, now is ${block.header.stateRoot.toString("hex")}`);
  }

  // check receipt state trie
  if (validateTrie && this.receiptManager.getTrieRoot().toString("hex") !== block.header.receiptRoot.toString("hex")) {
    await Promise.reject(`runBlock, receiptStateRoot should be ${this.receiptManager.getTrieRoot().toString("hex")}, now is ${block.header.receiptRoot.toString("hex")}`);
  }

  // check txsHash
  if (validateTxsHash && txsHash.toString("hex") !== block.header.txsHash.toString("hex"))
  {
    await Promise.reject(`runBlock, txsHash should be ${txsHash.toString("hex")}, now is ${block.header.txsHash.toString("hex")}`);
  }

  await this.stateManager.commit();
  
  await this.receiptManager.commit();

  this.stateManager.clearCache();

  return {
    state: true,
    msg: "",
    transactions: []
  }
}
