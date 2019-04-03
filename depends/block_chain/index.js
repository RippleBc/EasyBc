const utils = require("../utils");
const StateManager = require("./stateManager.js");
const Block = require("../block");
const assert = require("assert");

const Buffer = utils.Buffer;

const KEY_BLOCK_CHAIN_HEGHIT = utils.toBuffer("KEY_BLOCK_CHAIN_HEGHIT");

class BlockChain
{
  constructor(opts)
  {
    opts = opts || {};

    this.stateManager = new StateManager({
      trie: opts.trie
    });
    this.db = opts.db;

    if(this.db === undefined)
    {
      throw new Error(`BlockChain constructor, opts.db should not be undefined`);
    }

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

    let hash;
    try
    {
      hash = await this.db.get(number);
    }
    catch(e)
    {
      if(e.toString().indexOf("NotFoundError: Key not found in database") >= 0)
      {
        return undefined;
      }

      await Promise.reject(`getBlockHashByNumber, throw exception, ${e}`)
    }

    return hash;
  }

  /**
   * @param {Buffer} hash
   */
  async getBlockByHash(hash) 
  {
    assert(Buffer.isBuffer(hash), `BlockChain getBlockByHash, hash should be an Buffer, now is ${typeof hash}`);

    let raw;
    try
    {
      raw = await this.db.get(hash);
    }
    catch(e)
    {
      if(e.toString().indexOf("NotFoundError: Key not found in database") >= 0)
      {
        return undefined;
      }

      await Promise.reject(`getBlockByHash, throw exception, ${e}`);
    }
     
    return new Block(raw)
  }

  /**
   * @param {Buffer} number
   */
  async getBlockByNumber(number)
  {
    assert(Buffer.isBuffer(number), `BlockChain getBlockByNumber, number should be an Buffer, now is ${typeof number}`);
    
    const hash = await this.getBlockHashByNumber(number);
    if(!hash)
    {
      return undefined;
    }

    const block = await this.getBlockByHash(hash); 
    
    return block;
  }

  async getBlockChainHeight()
  {
    let blockChainHeight;
    try
    {
      blockChainHeight = await this.db.get(KEY_BLOCK_CHAIN_HEGHIT);
    }
    catch(e)
    {
      if(e.toString().indexOf("NotFoundError: Key not found in database") >= 0)
      {
        return undefined;
      }

      await Promise.reject(`getBlockChainHeight, throw exception, ${e}`);
    }
    
    
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