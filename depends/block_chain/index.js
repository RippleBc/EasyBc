const utils = require("../utils");
const StateManager = require("./stateManager.js");
const Block = require("../block");
const assert = require("assert");

const Buffer = utils.Buffer;

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
    
    return await this.db.getBlockHashByNumber(number);
  }

  /**
   * @param {Buffer} hash
   */
  async getBlockByHash(hash) 
  {
    assert(Buffer.isBuffer(hash), `BlockChain getBlockByHash, hash should be an Buffer, now is ${typeof hash}`);

    return await this.db.getBlockByHash(hash);
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
    return await this.db.getBlockChainHeight();
  }

  /**
   * Add new block to block chain
   * @param {Block} block
   */
  async addBlock(block)
  {
    assert(block instanceof Block, `BlockChain addBlock, block should be an Block Object, now is ${typeof block}`);

    await this.db.saveTransactions(block.header.number, block.transactions);
    await this.db.saveBlock(block);
  }

  /**
   * @param {Buffer} number
   * @param {Buffer} stateRoot
   * @param {Array} accounts
   */
  async saveAccounts(number, stateRoot, accounts)
  {
    assert(Buffer.isBuffer(number), `BlockChain saveAccounts, number should be an Buffer, now is ${typeof number}`);
    assert(Buffer.isBuffer(stateRoot), `BlockChain saveAccounts, stateRoot should be an Buffer, now is ${typeof stateRoot}`);
    assert(Array.isArray(accounts), `BlockChain saveAccounts, accounts should be an Array, now is ${typeof accounts}`);

    await this.db.saveAccounts(number, stateRoot, accounts);
  }
}

module.exports = BlockChain;