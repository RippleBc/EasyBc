const utils = require("../utils");
const createTree = require("functional-red-black-tree");
const Account = require("../account");
const async = require("async");
const assert = require("assert");
const Trie = require("merkle-patricia-tree");

const Buffer = utils.Buffer;

class Cache
{
  constructor(trie)
  {
    assert(trie instanceof Trie, `Cache constructor, trie should be a Tire Object, now is ${typeof Trie}`);

    this._cache = createTree();
    this._deletes = [];
    this._trie = trie;
  }

  /**
   * @param {Buffer} address
   * @param {Buffer} val
   * @param {Boolean} modified
   */
  put(address, val, modified)
  {
    assert(Buffer.isBuffer(address), `Cache put, address should be an Buffer, now is ${typeof address}`);
    assert(Buffer.isBuffer(val), `Cache put, val should be an Buffer, now is ${typeof val}`);
    assert(typeof modified === "boolean", `Cache put, modified should be an Boolean, now is ${typeof modified}`);

    this._updateToCache(address, val, modified);
  }

  /**
   * @param {Buffer} address
   */
  get(address)
  {
    assert(Buffer.isBuffer(address), `Cache get, address should be an Buffer, now is ${typeof address}`);

    return this._lookupAccountFromCache(address);
  }

  /**
   * @param {Buffer} address
   */
  async getOrLoad(address)
  {
    assert(Buffer.isBuffer(address), `Cache getOrLoad, address should be an Buffer, now is ${typeof address}`);

    // try to fetch account from cache
    let account;
    try
    {
      account = this._lookupAccountFromCache(address);
    }
    catch(e)
    {
      await Promise.reject(`Cache getOrLoad, _lookupAccountFromCache throw exception ${e}`);
    }

    if(!account.isEmpty())
    {
      return account;
    }
 
    // try to fetch account from db
    account = await this._lookupAccountFromDb(address);

    // account into cache
    try
    {
      this._updateToCache(address, account.serialize(), false);
    }
    catch(e)
    {
      await Promise.reject(`Cache getOrLoad, _updateToCache throw exception ${e}`);
    }
      
    return account;
  }

  /**
   * @param {Array/Buffer} addresses
   */
  async warm(addresses)
  {
    assert(Array.isArray(addresses), `Cache warm, addresses should be an Array, now is ${typeof addresses}`);

    for(let i = 0; i < addresses.length; i++)
    {
      let address = addresses[i];

      const account = await this._lookupAccountFromDb(address);

      try
      {
        this._updateToCache(address, account.serialize(), false);
      }
      catch(e)
      {
        await Promise.reject(`Cache warm, _updateToCache throw exception ${e}`)
      }
    } 
  }

  /**
   * @param {Buffer} address
   */
  del(address)
  {
    assert(Buffer.isBuffer(address), `Cache del, address should be an Buffer, now is ${typeof address}`);

    this._deletes.push(address);
    this._cache = this._cache.remove(address);
  }

  clear()
  {
    this._deletes = [];
    this._cache = createTree();
  }

  async flush()
  {
    var it = this._cache.begin;
    
    // flush modified account
    while(true)
    {
      if(it.value && it.value.modified)
      {
        it.value.modified = false;
        await this._trie.put(it.key, it.value.val);
      }

      if(it.hasNext)
      {
        it.next();
      }
      else
      {
        break;
      }
    }
      
    // flush deleted account
    for(let i = 0; i < this._deletes.length; i++)
    {
      let address = this._deletes[i];
      await this._trie.del(address);
    }
    this._deletes = [];
  }

  /**
   * @param {Buffer} address 
   */
  _lookupAccountFromCache(address)
  {
    assert(Buffer.isBuffer(address), `Cache _lookupAccountFromCache, address should be an Buffer, now is ${typeof address}`);

    let it = this._cache.find(address);
    if(it.node)
    {
      return new Account(it.value.val);
    }

    return new Account();
  }

  /**
    * @param {Buffer} address 
    */
  async _lookupAccountFromDb(address)
  {
    assert(Buffer.isBuffer(address), `Cache _lookupAccountFromDb, address should be an Buffer, now is ${typeof address}`);

    const accountRaw = await this._trie.get(address);
    
    return new Account(accountRaw);
  }

  /**
   * @param {Buffer} address 
   * @param {Buffer} val 
   * @param {Boolean} modified
   */
  _updateToCache(address, val, modified)
  {
    assert(Buffer.isBuffer(address), `Cache _updateToCache, address should be an Buffer, now is ${typeof address}`);
    assert(Buffer.isBuffer(val), `Cache _updateToCache, val should be an Buffer, now is ${typeof val}`);
    assert(typeof modified === "boolean", `Cache _updateToCache, modified should be an Boolean, now is ${typeof modified}`);

    var it = this._cache.find(address);

    if(it.node)
    {
      this._cache = it.update({
        val: val,
        modified: modified
      });
    }
    else
    {
      this._cache = this._cache.insert(address, {
        val: val,
        modified: modified
      })
    }
  }
}

module.exports = Cache;