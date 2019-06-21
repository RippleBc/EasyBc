const TrieNode = require('./trieNode')
const utils = require('../utils')
const { bufferToNibbles, matchingNibbleLength } = require('./util/nibbles')
const BaseTrie = require("./BaseTrie");
const assert = require("assert");

const toBuffer = utils.toBuffer; 
const sha3 = utils.sha3; 
const rlp = utils.rlp; 

/**
 * Returns a merkle proof for a given key
 * @method prove
 * @param {Trie} trie
 * @param {Buffer} key
 * @param {Function} cb - the cb return following arguments
 *   - {Error} err
 *   - {Array} proof - the ele of nodes is a node's serialized data
 */
module.exports.prove = function(trie, key, cb) 
{
  assert(trie instanceof BaseTrie, `prove, trie should be an instance of BaseTrie, now is ${typeof trie}`)
  assert(Buffer.isBuffer(key), `prove, key should be an Buffer, now is ${typeof key}`)

  trie.findPath(key, function (err, node, remainder, stack) {
    if(err) 
    {
      return cb(err)
    }
    if(remainder.length > 0) 
    {
      return cb(new Error(`prove, there is no value correspond to key: 0x${key.toString('hex')}`))
    }

    let p = []
    for(let i = 0; i < stack.length; i++) 
    {
      let rlpNode = stack[i].serialize()

      // 当rlpNode的序列化数据小于32时，实际上这个节点时存储在父节点中的，对应于底层存储结构，没有此节点（一般情况下父节点只存储子节点的哈希值）
      if((rlpNode.length >= 32) || (i === 0)) 
      {
        p.push(rlpNode)
      }
    }
    cb(null, p)
  })
}

/**
 * Verifies a merkle proof for a given key
 * @method verifyProof
 * @param {Buffer} rootHash
 * @param {Buffer} key
 * @param {Array/Buffer} proof
 * @param {Function} cb - return following arguments
 *   - {Error} err
 *   - {Buffer} val
 */
module.exports.verifyProof = function(rootHash, key, proof, cb) 
{
  assert(Buffer.isBuffer(rootHash), `verifyProof, rootHash should be an Buffer, now is ${typeof rootHash}`);
  assert(Buffer.isBuffer(key), `verifyProof, key should be an Buffer, now is ${typeof key}`);
  assert(Array.isArray(proof), `verifyProof, proof should be an Array, now is ${typeof proof}`);

  key = bufferToNibbles(key)

  for(let i = 0; i < proof.length; i++)
  {
    let nodeSerializedData = proof[i]
    let hash = sha3(proof[i])

    // 判断节点哈西是否相同
    if(Buffer.compare(hash, rootHash))
    {
      return cb(new Error('verifyProof, Bad proof node ' + i + ': hash mismatch'))
    }

    let node = new TrieNode(rlp.decode(nodeSerializedData))
    let cld
    if(node.type === 'branch') 
    {
      if(key.length === 0) 
      {
        if(i !== proof.length - 1) 
        {
          return cb(new Error('verifyProof, Additional nodes at end of proof (branch)'))
        }
        return cb(null, node.value)
      }

      // 获取branchKey
      cld = node.raw[key[0]]
      // 重新设置key
      key = key.slice(1)

      if(cld.length === 2)
      {
        // 分支节点的槽位中存储的是子节点的序列化值（叶子节点）
        var embeddedNode = new TrieNode(cld)
        if(i !== proof.length - 1) 
        {
          return cb(new Error('verifyProof, Additional nodes at end of proof (embeddedNode)'))
        }

        if(matchingNibbleLength(embeddedNode.key, key) !== embeddedNode.key.length) 
        {
          return cb(new Error('verifyProof, Key length does not match with the proof one (embeddedNode)'))
        }

        key = key.slice(embeddedNode.key.length)
        if(key.length !== 0) 
        {
          return cb(new Error('verifyProof, Key does not match with the proof one (embeddedNode)'))
        }

        return cb(null, embeddedNode.value)
      } 
      else 
      {
        rootHash = cld
      }
    } 
    else if((node.type === 'extention') || (node.type === 'leaf')) 
    {
      if(matchingNibbleLength(node.key, key) !== node.key.length) 
      {
        return cb(new Error('verifyProof, Key does not match with the proof one (extention|leaf)'))
      }

      // cld可能是一个Buffer也可能是一个Array，如果是Buffer则cld为子节点的哈希，如果是Array则cld为子节点的序列化值
      cld = node.value
      key = key.slice(node.key.length)

      if(key.length === 0 || (cld.length === 17 && key.length === 1))
      {
        // 扩展节点中存储的是分支节点的序列化值
        if(cld.length === 17) 
        {
          cld = cld[key[0]][1]
          key = key.slice(1)
        }

        if(i !== proof.length - 1)
        {
          return cb(new Error('verifyProof, Additional nodes at end of proof (extention|leaf)'))
        }

        return cb(null, new TrieNode(cld).value)
      } 
      else 
      {
        rootHash = cld
      }
    } 
    else 
    {
      return cb(new Error('verifyProof, Invalid node type'))
    }
  }
  
  cb(new Error('verifyProof, Unexpected end of proof'))
}
