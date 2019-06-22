const utils = require('../utils')
const CheckpointTrie = require('./checkpointTrie')
const BaseTrie = require('./baseTrie')
const assert = require('assert')

const sha256 = utils.sha256;
const Buffer = utils.Buffer;

/**
 * You can create a secure Trie where the keys are automatically hashed
 * using **keccak256** by using `require('merkle-patricia-tree/secure')`.
 * It has the same methods and constructor as `Trie`.
 * @class SecureTrie
 * @extends Trie
 * @public
 */
class SecureTrie extends CheckpointTrie 
{
  constructor (...args) 
  {
    super(...args)
  }

  /**
   * @param {BaseTrie} trie
   * @param {Buffer} key
   * @param {Function} cb
   * @return {Array}
   */
  static prove(trie, key, cb) 
  {
    assert(trie instanceof BaseTrie, `SecureTrie prove, trie should be an instance of BaseTrie, now is ${typeof trie}`)
    assert(Buffer.isBuffer(key), `SecureTrie prove, key should be an Buffer, now is ${typeof key}`);

    const hash = sha256(key)
    super.prove(trie, hash, cb)
  }

  /**
   * @param {Buffer} rootHash
   * @param {Buffer} key
   * @param {Arrat} proof
   */
  static verifyProof(rootHash, key, proof, cb) 
  {
    assert(Buffer.isBuffer(rootHash), `SecureTrie verifyProof, rootHash should be an Buffer, now is ${typeof rootHash}`);
    assert(Buffer.isBuffer(key), `SecureTrie verifyProof, key should be an Buffer, now is ${typeof key}`);
    assert(Array.isArray(proof), `SecureTrie verifyProof, key should be an Array, now is ${typeof key}`);

    const hash = sha256(key)
    super.verifyProof(rootHash, hash, proof, cb)
  }

  copy() 
  {
    const db = this.db.copy()
    return new SecureTrie(db, this.root)
  }

  /**
   * @param {Buffer} key
   * @param {Function} cb
   */
  get(key, cb) 
  {
    assert(Buffer.isBuffer(key), `SecureTrie get, key should be an Buffer, now is ${typeof key}`);

    const hash = sha256(key)
    super.get(hash, cb)
  }

  /**
   * @param {Buffer} key
   * @param {Buffer} val
   * @param {Function} cb
   */
  put(key, val, cb)
  {
    assert(Buffer.isBuffer(key), `SecureTrie put, key should be an Buffer, now is ${typeof key}`);

    if(!val || val.toString() === '') 
    {
      this.del(key, cb)
    } 
    else 
    {
      assert(Buffer.isBuffer(val), `SecureTrie put, val should be an Buffer, now is ${typeof val}`);
      
      const hash = sha256(key)
      super.put(hash, val, cb)
    }
  }

  /**
   * @param {Buffer} key
   * @param {Function} cb
   */
  del(key, cb) 
  {
    assert(Buffer.isBuffer(key), `SecureTrie del, key should be an Buffer, now is ${typeof key}`);

    const hash = sha256(key)
    super.del(hash, cb)
  }
}

module.exports = SecureTrie