const utils = require('../utils')
const { bufferToNibbles, nibblesToBuffer } = require('./util/nibbles')
const { isTerminator, addHexPrefix, removeHexPrefix } = require('./util/hex')
const assert = require('assert');

const rlp = utils.rlp;
const sha256 = utils.sha256;

class TrieNode 
{
  /**
   * @param {Array | String} type - Array表示节点的元数据，String表示节点的类型
   * @param {Array | Buffer} key - Array对应的是nibblesArray，只有在键值对节点才会用到
   * @param {Buffer} value - Array对应的是nibblesArray，只有在键值对节点才会用到
   */
  constructor(type, key, value) 
  {
    assert(Array.isArray(type) || typeof type === 'string', `TrieNode constructor, type should be an Array or String, now is ${typeof type}`);

    if(key)
    {
      assert(Array.isArray(key) || Buffer.isBuffer(key), `TrieNode constructor, key should be an Array or Buffer, now is ${typeof key}`);
    }
    if(value)
    {
      assert(Buffer.isBuffer(value), `TrieNode constructor, value should be an Buffer, now is ${typeof value}`);
    }
    
    if(Array.isArray(type))
    {
      this.parseNode(type)
    } 
    else 
    {
      this.type = type
      if(type === 'branch') 
      {
        this.raw = new Array(17)
      } 
      else 
      {
        this.raw = new Array(2)
        this.setValue(value)
        this.setKey(key)
      }
    }

    Object.defineProperty(this, 'length', {
      get() 
      {
        return this.raw.length;
      }
    })
  }

  static isRawNode(node) 
  {
    return Array.isArray(node)
  }

  get value() 
  {
    return this.getValue()
  }

  set value(v) 
  {
    this.setValue(v)
  }

  get key() 
  {
    return this.getKey()
  }

  set key(k) 
  {
    this.setKey(k)
  }

  /**
   * @param {Array} rawNode
   */
  parseNode(rawNode)
  {
    assert(Array.isArray(rawNode), `TrieNode parseNode, rawNode should be an Array, now is ${typeof rawNode}`)

    if(rawNode.length === 17) 
    {
      this.type = 'branch'
    } 
    else if(rawNode.length === 2) 
    {
      let key = bufferToNibbles(rawNode[0])
      // 叶子节点拥有结束标记
      if(isTerminator(key))
      {
        this.type = 'leaf'
      }
      else
      {
        this.type = 'extention'
      }
    }
    else
    {
      throw new Error(`TrieNode parseNode, invalid rawNode, ${rawNode.toString()}`);
    }

    this.raw = rawNode;
  }

  setValue(key, value)
  {
    if(this.type === 'branch') 
    {
      if(arguments.length === 1)
      {
        value = key;
        key = 16;
      }

      // 节点中即可存储子节点的哈希也可以存储子节点的元数据
      if(value)
      {
        assert(Buffer.isBuffer(value) || Array.isArray(value), `TrieNode setValue, value should be an Buffer or Array, now is ${typeof value}`);
      }

      this.raw[key] = value
    }
    else 
    {
      value = key;

      // 节点中即可存储子节点的哈希也可以存储子节点的元数据
      if(value)
      {
        assert(Buffer.isBuffer(value) || Array.isArray(value), `TrieNode setValue, value should be an Buffer or Array, now is ${typeof value}`);
      }
      
      this.raw[1] = value
    }
  }

  /**
   * @return {Buffer}
   */
  getValue(key)
  {
    if(this.type === 'branch') 
    {
      if(arguments.length === 0)
      {
        key = 16
      }

      let val = this.raw[key]
      if(Buffer.isBuffer(val) && val.length === 0)
      {
        val = undefined;
      }

      return val
    }
    else 
    {
      let val = this.raw[1];
      if(Buffer.isBuffer(val) && val.length === 0)
      {
        val = undefined;
      }

      return val
    }
  }

  /**
   * @param {Array | Buffer} key
   */
  setKey(key)
  {
    assert(Array.isArray(key) || Buffer.isBuffer(key), `TrieNode setKey, key should be an Array or Buffer, now is ${typeof key}`);

    if(this.type !== 'branch')
    {
      if(Buffer.isBuffer(key))
      {
        key = bufferToNibbles(key);
      }
      // copy the key
      key = key.slice(0)

      // 对键值进行编码
      key = addHexPrefix(key, this.type === 'leaf')
      this.raw[0] = nibblesToBuffer(key)
    }
  }

  /**
   * @return {Array} - nibblesArray
   */
  getKey()
  {
    if(this.type !== 'branch') 
    {
      var key = this.raw[0]
      key = removeHexPrefix(bufferToNibbles(key))
      return key
    }
  }

  serialize()
  {
    return rlp.encode(this.raw)
  }

  hash() 
  {
    return sha256(this.serialize())
  }

  toString()
  {
    var out = this.type
    out += ': ['
    this.raw.forEach(el => {
      if(Buffer.isBuffer(el))
      {
        out += el.toString('hex') + ', '
      } 
      else if(el)
      {
        // 记录的是一个完整的TrieNode节点
        out += `TrieNode: ${new TrieNode(el).toString()}, `
      } 
      else 
      {
        out += 'empty, '
      }
    })
    out = out.slice(0, -2)
    out += ']'
    return out
  }

  getChildren()
  {
    let children = []
    switch(this.type)
    {
      case 'leaf':
        // no children
        break
      case 'extention':
        // one child
        children.push([this.key, this.getValue()])
        break
      case 'branch':
        for(let index = 0, end = 16; index < end; index++) {
          let value = this.getValue(index)
          if(value)
          {
            children.push([[index], value])
          }
        }
        break
    }
    return children
  }
}

module.exports = TrieNode;