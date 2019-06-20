const rlp = require('rlp')
const ethUtil = require('ethereumjs-util')
const { bufferToNibbles, nibblesToBuffer } = require('./util/nibbles')
const { isTerminator, addHexPrefix, removeHexPrefix } = require('./util/hex')

module.exports = class TrieNode {
  /**
   * @param {*} type 可以是一个分支节点或者键值对节点；也可以是一个字符串，表示的是节点类型，配合key和value参数进行初始化
   */
  constructor (type, key, value) {
    if (Array.isArray(type)) {
      // parse raw node
      this.parseNode(type)
    } else {
      this.type = type
      if (type === 'branch') {
        // 分支节点
        this.raw = Array.apply(null, Array(17))
        // 初始化key值（key是一个数组，成员也是一个数组，成员的第一个元素表示的是分支节点的key（0~16），成员的第二个元素是一个哈西字符串，指向下一个节点）
        if (key) {
          key.forEach(function (keyVal) {
            // apply方法使得this劫持另外一个对象的方法，继承另外一个对象的属性
            this.set.apply(this, keyVal)
          })
        }
      } else {
        // 键值对节点
        this.raw = Array(2)
        this.setValue(value)
        this.setKey(key)
      }
    }
  }

  /**
   * Determines the node type.
   * @private
   * @returns {String} - the node type
   *   - leaf - if the node is a leaf
   *   - branch - if the node is a branch
   *   - extention - if the node is an extention
   *   - unknown - if something else got borked
   */
  static getNodeType (node) {
    // 表示的是分支节点
    if (node.length === 17) {
      return 'branch'
    } 
    // 表示的是键值对节点
    else if (node.length === 2) {
      var key = bufferToNibbles(node[0])
      // 键值对节点中的叶子节点（拥有结束标记，对应的值是需要进行存储的值）
      if (isTerminator(key)) {
        return 'leaf'
      }

      // 键值对节点中的扩展节点（不拥有结束标记，对应的值指向下一个键值对节点的哈希值）
      return 'extention'
    }
  }

  static isRawNode (node) {
    return Array.isArray(node) && !Buffer.isBuffer(node)
  }

  get value () {
    return this.getValue()
  }

  set value (v) {
    this.setValue(v)
  }

  get key () {
    return this.getKey()
  }

  set key (k) {
    this.setKey(k)
  }

  parseNode (rawNode) {
    this.raw = rawNode
    this.type = TrieNode.getNodeType(rawNode)
  }

  setValue (key, value) {
    if (this.type !== 'branch') {
      // 键值对节点
      this.raw[1] = key
    } else {
      // 分支节点（key、value都存在的情况下，key的取之范围为0~16）
      if (arguments.length === 1) {
        value = key
        // 16为结束标记，对应的value便是需要进行存储的值
        key = 16
      }
      // value为一个哈西字符串，指向下一个节点
      this.raw[key] = value
    }
  }

  getValue (key) {
    if (this.type === 'branch') {
      // 分支节点
      if (arguments.length === 0) {
        key = 16
      }

      var val = this.raw[key]
      if (val !== null && val !== undefined && val.length !== 0) {
        return val
      }
    } else {
      return this.raw[1]
    }
  }

  setKey (key) {
    if (this.type !== 'branch') {
      // 键值对节点
      if (Buffer.isBuffer(key)) {
        key = bufferToNibbles(key)
      } else {
        key = key.slice(0) // copy the key
      }

      // 对键值进行编码（需要通过一定的规则，把键值编码为偶数长度）
      key = addHexPrefix(key, this.type === 'leaf')
      this.raw[0] = nibblesToBuffer(key)
    }
  }

  getKey () {
    if (this.type !== 'branch') {
      var key = this.raw[0]
      key = removeHexPrefix(bufferToNibbles(key))
      return (key)
    }
  }

  serialize () {
    return rlp.encode(this.raw)
  }

  hash () {
    return ethUtil.sha3(this.serialize())
  }

  toString () {
    var out = this.type
    out += ': ['
    this.raw.forEach(function (el) {
      if (Buffer.isBuffer(el)) {
        out += el.toString('hex') + ', '
      } else if (el) {
        out += 'object, '
      } else {
        out += 'empty, '
      }
    })
    out = out.slice(0, -2)
    out += ']'
    return out
  }

  getChildren () {
    var children = []
    switch (this.type) {
      case 'leaf':
        // no children
        break
      case 'extention':
        // one child
        children.push([this.key, this.getValue()])
        break
      case 'branch':
        for (var index = 0, end = 16; index < end; index++) {
          var value = this.getValue(index)
          if (value) {
            children.push([
              [index], value
            ])
          }
        }
        break
    }
    return children
  }
}
