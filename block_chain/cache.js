const Buffer = require("safe-buffer").Buffer
const Tree = require("functional-red-black-tree")
const Account = require("../account")
const async = require("async")

class Cache
{
  constructor(trie)
  {
    this._cache = Tree();
    this._deletes = [];
    this._trie = trie;
  }

  /**
   * @param {Buffer} address
   * @param {Buffer} val
   * @param {Boolean} fromTrie if address-value is from db
   */
  put(address, val, fromTrie)
  {
    let modified = !fromTrie;

    this._updateToCache(address, val, modified, true);
  }

  /**
   * @param {Buffer} address
   */
  get(address)
  {
    let account = this._lookupAccountFromCache(address);

    if(!account)
    {
      account = new Account();
      account.exists = false;
    }

    return account;
  }

  /**
   * @param {Buffer} address
   */
  getOrLoad(address, cb)
  {
    var self = this;
    var account = this._lookupAccountFromCache(address);
    if(account)
    {
      cb(null, account);
    }
    else
    {
      self._lookupAccountFromDb(address, function(err, account) {
        if(err)
        {
          return cb(err);
        }
        self._updateToCache(address, account, false, account.exists);
        cb(null, account);
      })
    }
  }

  /**
   * @param {Array} addresses the item of addresses is Buffer
   */
  warm(addresses, cb)
  {
    var self = this;

    // shim till async supports iterators
    var accountArr = [];
    addresses.forEach(function(val) {
      if(!!val)
      {
        accountArr.push(val);
      }
    });
    
    async.eachSeries(accountArr, function(address, done) {
      self._lookupAccountFromDb(address, function(err, account) {
        if(err)
        {
          return done(err);
        }
        self._updateToCache(address, account, false, account.exists);
        done();
      });
    }, cb);
  }

  del(address)
  {
    this._deletes.push(address);
    address = address.toString("hex");
    this._cache = this._cache.remove(address);
  }

  clear()
  {
    this._deletes = [];
    this._cache = Tree();
  }

  /**
   * flush cache to db
   * @method flush
   */
  flush(cb)
  {
    var it = this._cache.begin;
    var self = this;
    var next = true;
    async.whilst(function() {
      return next;
    }, function(done) {
      if(it.value && it.value.modified)
      {
        it.value.modified = false;
        it.value.val = it.value.val.serialize();
        self._trie.put(Buffer.from(it.key, "hex"), it.value.val, function(err) {
          if(!!err)
          {
            return done(err);
          }

          next = it.hasNext;
          it.next();
          done();
        });
      }
      else
      {
        next = it.hasNext;
        it.next();
        done();
      }
    }, function(err) {
      if(!!err)
      {
        return cb(err);
      }
      
      async.eachSeries(self._deletes, function(address, done) {
        self._trie.del(Buffer.from(address, "hex"), done);
      }, function(err) {
        if(!!err)
        {
          return cb(err);
        }
        self._deletes = [];
        cb();
      });
    });
  }

  /**
    * @param {Buffer} address 
    */
  _lookupAccountFromCache(address)
  {
    address = address.toString("hex");

    let it = this._cache.find(address);
    if(it.node)
    {
      let account = new Account(it.value.val);
      account.exists = it.value.exists;
      return account;
    }

    return null;
  }

  /**
    * @param {Buffer} address 
    */
  _lookupAccountFromDb(address, cb)
  {
    this._trie.get(address, function(err, raw) {
      if(err) 
      {
        return cb(err);
      }
      let account = new Account(raw);

      // account not exist
      let exists = !!raw;
      account.exists = exists;

      cb(null, account);
    })
  }

  /**
    * @param {Buffer} address 
    * @param {Buffer} val 
    * @param {Boolean} modified 
    */
  _updateToCache(address, val, modified, exists)
  {
    address = address.toString("hex");
    var it = this._cache.find(address);

    if(it.node)
    {
      this._cache = it.update({
        val: val,
        modified: modified,
        exists: exists || it.value.exists
      });
    }
    else
    {
      this._cache = this._cache.insert(address, {
        val: val,
        modified: modified,
        exists: exists
      })
    }
  }
}

module.exports = Cache;