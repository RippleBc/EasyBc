const utils = require("../utils");
const StateManager = require("./stateManager.js");
const ReceiptManager = require("./receiptManager.js");
const Block = require("../block");
const assert = require("assert");
const Trie = require("../merkle_patricia_tree");

const Buffer = utils.Buffer;

class BlockChain
{
  constructor(opts)
  {
    opts = opts || {};

    this.stateManager = new StateManager({
      trie: new Trie(opts.mptDb, opts.root)
    });
    this.receiptManager = new ReceiptManager({
      trie: new Trie(opts.receiptMptDb)
    })
    this.blockDb = opts.blockDb;

    this.runBlockChain = require("./runBlockChain.js");
    this.runBlock = require("./runBlock.js");
    this.runTx = require("./runTx.js");
  }

  /**
   * @param {Buffer} number
   * @return {Buffer}
   */
  async getBlockHashByNumber(number)
  {
    assert(Buffer.isBuffer(number), `BlockChain getBlockHashByNumber, number should be an Buffer, now is ${typeof number}`);
    
    return await this.blockDb.getBlockHashByNumber(number);
  }

  /**
   * @param {Buffer} hash
   * @return {Block}
   */
  async getBlockByHash(hash) 
  {
    assert(Buffer.isBuffer(hash), `BlockChain getBlockByHash, hash should be an Buffer, now is ${typeof hash}`);

    return await this.blockDb.getBlockByHash(hash);
  }

  /**
   * @param {Buffer} number
   * @return {Block}
   */
  async getBlockByNumber(number)
  {
    assert(Buffer.isBuffer(number), `BlockChain getBlockByNumber, number should be an Buffer, now is ${typeof number}`);

    const block = await this.blockDb.getBlockByNumber(number); 
    
    return block;
  }

  /**
   * @return {Buffer}
   */
  async getBlockChainHeight()
  {
    return await this.blockDb.getBlockChainHeight();
  }

  /**
   * Add new block to block chain
   * @param {Block} block
   */
  async addBlock(block)
  {
    assert(block instanceof Block, `BlockChain addBlock, block should be an Block Object, now is ${typeof block}`);

    await this.blockDb.saveBlock(block);
  }
}

module.exports = BlockChain;