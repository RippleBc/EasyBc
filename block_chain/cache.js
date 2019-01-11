const Buffer = require("safe-buffer").Buffer
const Tree = require("functional-red-black-tree")
const Account = require("../../account")
const async = require("async")

class Cache
{
  constructor(trie)
  {
    this._cache = Tree();
    this._checkpoints = [];
    this._deletes = [];
    this._trie = trie;
  }

  /**
   * @param {Buffer} key
   * @param {Buffer} val
   * @param {Boolean} fromTrie if key-value is from db
   */
  function put(key, val, fromTrie)
  {
    let modified = !fromTrie;

    this._updateToCache(key, val, modified, true);
  }

  /**
   * @param {Buffer} key
   */
  function get(key)
  {
    let account = this._lookupAccountFromCache(key);

    if(!account)
    {
      account = new Account();
      account.exists = false;
    }

    return account;
  }

  /**
   * @param {Buffer} key
   */
  function getOrLoad(key, cb)
  {
    var self = this;
    var account = this._lookupAccountFromCache(key);
    if(account)
    {
      cb(null, account);
    }
    else
    {
      self._lookupAccountFromDb(key, function(err, account) {
        if(err)
        {
          return cb(err);
        }
        self._updateToCache(key, account, false, accout.exists);
        cb(null, account);
      })
    }
  }

  /**
   * @param {Array} addresses the item of addresses is Buffer
   */
  function warm(addresses, cb)
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

  function checkpoint()
  {
    this._checkpoints.push(this._cache);
  }

  function revert()
  {
    this._cache = this._checkpoints.pop();
  }

  function commit()
  {
    this._flush();
    this._checkpoints.pop();
  }

  function clear()
  {
    this._deletes = [];
    this._cache = Tree();
  }

  function del(key)
  {
    this._deletes.push(key);
    key = key.toString("hex");
    this._cache = this._cache.remove(key);
  }

  /**
   * flush cache to db
   * @method flush
   */
  function _flush(cb)
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
        self._trie.put(Buffer.from(it.key, "hex"), it.value.val, function() {
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
    }, function() {
      async.eachSeries(self._deletes, function (address, done) {
        self._trie.del(address, done);
      }, function () {
        self._deletes = [];
        cb();
      });
    });
  }

  /**
    * @param {Buffer} address 
    */
  function _lookupAccountFromCache(address)
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
  function _lookupAccountFromDb(address, cb)
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
    * @param {Buffer} key 
    * @param {Buffer} val 
    * @param {Boolean} modified 
    */
  function _updateToCache(key, val, modified, exists)
  {
    key = key.toString("hex");
    var it = this._cache.find(key);

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
      this._cache = this._cache.insert(key, {
        val: val,
        modified: modified,
        exists: exists
      })
    }
  }
}

module.exports = Cache;