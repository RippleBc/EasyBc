const level = require('level-mem')
const assert = require('assert');

const ENCODING_OPTS = { keyEncoding: 'binary', valueEncoding: 'binary' }

class DB 
{
  constructor(db) 
  {
    this._db = db || level()
  }

  /**
   * @param {Buffer} key
   * @param {Function} cb
   */
  get(key, cb) 
  {
    assert(Buffer.isBuffer(key), `DB get, key should be an Buffer, now is ${typeof key}`);

    this._db.get(key, ENCODING_OPTS, (err, v) => {
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

    this._db.put(key, val, ENCODING_OPTS, cb)
  }

  /**
   * @param {Buffer} key
   * @param {Function} cb
   */
  del(key, cb)
  {
    assert(Buffer.isBuffer(key), `DB del, key should be an Buffer, now is ${typeof key}`);

    this._db.del(key, ENCODING_OPTS, cb)
  }

  /**
   * @param {Array} opStack
   * @param {Function} cb
   */
  batch(opStack, cb)
  {
    assert(Array.isArray(opStack), `DB batch, opStack should be an Array, now is ${typeof opStack}`);

    this._db.batch(opStack, ENCODING_OPTS, cb)
  }

  /**
   * Returns a copy of the DB instance, with a reference to the same underlying db instance
   */
  copy() 
  {
    return new DB(this._db)
  }
}

module.exports = DB;