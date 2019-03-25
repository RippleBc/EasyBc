const utils = require("../utils");
const StateManager = require("./stateManager.js");
const AsyncEventEmitter = require("async-eventemitter");
const Block = require("../block");
const assert = require("assert");

const Buffer = utils.Buffer;

const KEY_BLOCK_CHAIN_HEGHIT = utils.toBuffer("KEY_BLOCK_CHAIN_HEGHIT");

class BlockChain extends AsyncEventEmitter
{
  constructor(opts)
  {
    super();

    opts = opts || {};

    this.stateManager = new StateManager({
      trie: opts.trie
    });
    this.db = opts.db;

    this.runBlockChain = require("./runBlockChain.js");
    this.runBlock = require("./runBlock.js");
    this.runTx = require("./runTx.js");
  }

  /**
   * @param {Buffer} number
   */
  async getBlockHashByNumber(number)
  {
    assert(Buffer.isBuffer(number), `BlockChain getBlockHashByNumber, number should be an Buffer, now is ${typeof number}`);

    const hash = await this.db.get(number);

    return hash;
  }

  /**
   * @param {Buffer} hash
   */
  async getBlockByHash(hash) 
  {
    assert(Buffer.isBuffer(hash), `BlockChain getBlockByHash, hash should be an Buffer, now is ${typeof hash}`);

    const raw = await this.db.get(hash);
     
    return new Block(raw)
  }

  /**
   * @param {Buffer} number
   */
  async getBlockByNumber(number)
  {
    assert(Buffer.isBuffer(number), `BlockChain getBlockByNumber, number should be an Buffer, now is ${typeof number}`);
    
    const hash = await this.getBlockHashByNumber(number);
    const block = await this.getBlockByHash(hash); 
    
    return block;
  }

  async getBlockChainHeight()
  {
    const blockChainHeight = await this.db.get(KEY_BLOCK_CHAIN_HEGHIT);
    return blockChainHeight;
  }

  /**
   * @param {Buffer} number
   */
  async updateBlockChainHeight(number)
  {
    assert(Buffer.isBuffer(number), `BlockChain updateBlockChainHeight, number should be an Buffer, now is ${typeof number}`);
    await this.db.put(KEY_BLOCK_CHAIN_HEGHIT, number);
  }

  /**
   * Add new block to block chain
   * @param {Block} block
   */
  async addBlock(block)
  {
    assert(block instanceof Block, `BlockChain addBlock, block should be an Block Object, now is ${typeof block}`);
    
    await this.db.put(block.header.number, block.hash());
    await this.db.put(block.hash(), block.serialize());
  }
}

module.exports = BlockChain;