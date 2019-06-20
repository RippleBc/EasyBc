const level = require('level-mem')
const assert = require('assert');

const ENCODING_OPTS = { keyEncoding: 'binary', valueEncoding: 'binary' }

class DB 
{
  constructor(leveldb) 
  {
    this._leveldb = leveldb || level()
  }

  /**
   * @param {Buffer} key
   * @param {Function} cb
   */
  get(key, cb) 
  {
    assert(Buffer.isBuffer(key), `DB get, key should be an Buffer, now is ${typeof key}`);

    this._leveldb.get(key, ENCODING_OPTS, (err, v) => {
      if (err || !v) {
        return cb(null, null)
      } 

      cb(null, v)
    })
  }

  /**
   * @param {Buffer} key
   * @param {Buffer} val
   * @param {Function} cb
   */
  put(key, val, cb) 
  {
    assert(Buffer.isBuffer(key), `DB put, key should be an Buffer, now is ${typeof key}`);
    assert(Buffer.isBuffer(val), `DB put, val should be an Buffer, now is ${typeof val}`);

    this._leveldb.put(key, val, ENCODING_OPTS, cb)
  }

  /**
   * @param {Buffer} key
   * @param {Function} cb
   */
  del(key, cb)
  {
    assert(Buffer.isBuffer(key), `DB del, key should be an Buffer, now is ${typeof key}`);

    this._leveldb.del(key, ENCODING_OPTS, cb)
  }

  /**
   * @param {Array} opStack
   * @param {Function} cb
   */
  batch(opStack, cb)
  {
    assert(Array.isArray(opStack), `DB batch, opStack should be an Array, now is ${typeof opStack}`);

    this._leveldb.batch(opStack, ENCODING_OPTS, cb)
  }

  /**
   * Returns a copy of the DB instance, with a reference to the same underlying leveldb instance
   */
  copy() 
  {
    return new DB(this._leveldb)
  }
}

module.exports = DB;