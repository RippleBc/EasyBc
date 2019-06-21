const DB = require('./db')
const { asyncFirstSeries } = require('./util/async')
const assert = require("assert")

const ENCODING_OPTS = { keyEncoding: 'binary', valueEncoding: 'binary' }

/**
 * An in-memory wrap over `DB` with an upstream DB
 * which will be queried when a key is not found
 * in the in-memory scratch. This class is used to implement
 * checkpointing functionality in CheckpointTrie.
 */
class ScratchDB extends DB 
{
  constructor(upstreamDB)
  {
    super()
    this._upstream = upstreamDB
  }

  /**
   * Similar to DB.get, but first searches in-memory scratch DB, if key not found, searches upstream DB.
   */
  get(key, cb) 
  {
    assert(Buffer.isBuffer(key), `ScratchDB get, key should be an Buffer, now is ${typeof key}`);

    const getDBs = this._upstream._db ? [this._db, this._upstream._db] : [this._db]
    const dbGet = (db, callback) => {
      db.get(key, ENCODING_OPTS, (err, v) => {
        if(err || !v) 
        {
          callback(null, null)
        } 
        else 
        {
          callback(null, v)
        }
      })
    }

    asyncFirstSeries(getDBs, dbGet, cb)
  }

  copy()
  {
    const scratch = new ScratchDB(this._upstream)
    scratch._db = this._db

    return scratch
  }
}

module.exports = ScratchDB;
