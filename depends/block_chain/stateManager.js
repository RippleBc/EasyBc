const Trie = require("../trie");
const async = require("async");
const Account = require("../account");
const Cache = require("./cache.js");
const util = require("../utils");
const assert = require("assert");

const BN = util.BN;
const rlp = util.rlp;
const Buffer = util.Buffer;

class StateManager
{
  constructor(opts)
  {
    opts = opts || {};

    this.trie = opts.trie || new Trie();
    this.cache = new Cache(this.trie);
  }

  /**
   * @param {Buffer} address
   */
  async getAccount(address)
  {
    assert(Buffer.isBuffer(address), `StateManager getAccount, address should be an Buffer, now is ${typeof address}`);

    const account =  await this.cache.getOrLoad(address);
    return account;
  }

  /**
   * @param {Buffer} address
   * @param {Buufer} account
   */
  putAccount(address, account)
  {
    assert(Buffer.isBuffer(address), `StateManager putAccount, address should be an Buffer, now is ${typeof address}`);
    assert(Buffer.isBuffer(account), `StateManager putAccount, account should be an Buffer, now is ${typeof account}`);

    this.cache.put(address, account, true);
  }

  /**
   * @param {Buffer} address
   */
  delAccount(address)
  {
    assert(Buffer.isBuffer(address), `StateManager delAccount, address should be an Buffer, now is ${typeof address}`);

    this.cache.del(address);
  }

  /**
   * @param {Array} addresses 
   */
  async warmCache(addresses)
  {
    assert(Array.isArray(addresses), `StateManager warmCache, addresses should be an Array, now is ${typeof addresses}`);

    await this.cache.warm(addresses);
  }

  async flushCache()
  {
    await this.cache.flush();
  }

  clearCache()
  {
    this.cache.clear();
  }

  /*
   * @param {Buffer} root
   */
  initTrie(_root)
  {
    assert(Buffer.isBuffer(_root), `StateManager initTrie, root should be an Buffer, now is ${typeof _root}`);

    this.trie = new Trie(_root);
  }

  /**
   * @return {Buffer}
   */
  getTrieRoot()
  {
    return this.trie.root;
  }

  checkpoint()
  {
    this.trie.checkpoint();
  }

  async commit()
  {
    const promise = new Promise((resolve, reject) => {
      this.trie.commit(function(err) {
        if(!!err)
        {
          reject(err);
        }
        
        resolve();
      });
    });

    return promise;
  }

  async revert()
  {
    const promise = new Promise((resolve, reject) => {
      this.trie.revert(function(err) {
        if(!!err)
        {
          reject(err);
        }
        
        resolve();
      });
    });

    return promise;
  }
}
module.exports = StateManager;