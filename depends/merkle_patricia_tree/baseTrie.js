const assert = require('assert')
const async = require('async')
const utils = require('../utils')
const semaphore = require('semaphore')
const DB = require('./db')
const TrieNode = require('./trieNode')
const ReadStream = require('./readStream')
const PrioritizedTaskExecutor = require('./prioritizedTaskExecutor')
const { callTogether } = require('./util/async')
const { bufferToNibbles, matchingNibbleLength, doKeysMatch } = require('./util/nibbles')

const rlp = utils.rlp;
const Buffer = utils.Buffer;

/**
 * @class Trie
 * @public
 */
class Trie 
{
  /**
   * @param {DB} db, default is memdown
   * @param {Buffer} root
   */
  constructor(db, root)
  {
    if(db)
    {
      assert(db instanceof DB, `Trie constructor, db should be an instance of DB, now is ${typeof db}`);
    }
    if(root)
    {
      assert(Buffer.isBuffer(root), `Trie constructor, root should be an Buffer, now is ${typeof db}`);
    }
    
    this.sem = semaphore(1)

    this.db = db || new DB()

    Object.defineProperty(this, 'root', {
      set(value) 
      {
        if(value) 
        {
          assert(Buffer.isBuffer(value), `Trie set root, root should be an Buffer, now is ${typeof value}`)
          assert(value.length === 32, `Trie set root, root lenth should be 32 bytes, now is ${value.length}`)
        } 
        else
        {
          value = utils.SHA3_RLP
        }

        this._root = value
      },
      get()
      {
        return this._root
      }
    })

    this.root = root
  }

  /**
   * @param {Buffer} key
   * @param {Function} cb
   */
  get(key, cb) 
  {
    assert(Buffer.isBuffer(key), `Trie get, key should be an Buffer, now is ${typeof key}`)

    // try to find correponsed value
    this.findPath(key, (err, node, remainder, stack) => {
      let value = null

      if(node) 
      {
        value = node.value
      }

      cb(err, value)
    })
  }

  /**
   * @param {Buffer} key
   * @param {*} value
   * @param {Function} cb
   */
  put(key, value, cb) 
  {
    assert(Buffer.isBuffer(key), `Trie put, key should be an Buffer, now is ${typeof key}`)
    
    if(!value || value.toString() === '') 
    {
      return this.del(key, cb)
    }

    assert(Buffer.isBuffer(value), `Trie put, value should be an Buffer, now is ${typeof value}`)

    cb = callTogether(cb, this.sem.leave)

    this.sem.take(() => {
      if(this.root.toString('hex') !== utils.SHA3_RLP.toString('hex')) 
      {
        this.findPath(key, (err, foundValue, keyRemainder, stack) => {
          if(err) 
          {
            return cb(err)
          }
          
          this._updateNode(key, value, keyRemainder, stack, cb)
        })
      } 
      else 
      {
        this._createInitialNode(key, value, cb)
      }
    })
  }

  /**
   * @param {Buffer} key
   * @param {Function} cb
   */
  del(key, cb) 
  {
    assert(Buffer.isBuffer(key), `Trie del, key should be an Buffer, now is ${typeof key}`)

    cb = callTogether(cb, this.sem.leave)

    this.sem.take(() => {
      this.findPath(key, (err, foundValue, keyRemainder, stack) => {
        if(err)
        {
          return cb(err)
        }
        if(foundValue)
        {
          this._deleteNode(key, stack, cb)
        } 
        else
        {
          cb()
        }
      })
    })
  }

  /**
   * @param {Buffer | Array} node
   */
  _lookupNode(node, cb) 
  {
    // 节点中可以存储其他节点的元数据
    if(TrieNode.isRawNode(node)) 
    {
      return cb(null, new TrieNode(node))
    } 
   
    assert(Buffer.isBuffer(node), `Trie _lookupNode, node should be an Buffer, now is ${typeof node}`)

    this.db.get(node, (err, value) => {
      if(err) 
      {
        throw err
      }

      if(value) 
      {
        const trieNodeRawData = rlp.decode(value);

        value = new TrieNode(trieNodeRawData)
      } 
      else 
      {
        err = new Error(`Trie _lookupNode, node: ${node.toString("hex")}, can not find node in DB`);
      }

      cb(err, value)
    })
  }

  /**
   * @param {TrieNode} node
   * @param {Function} cb
   */
  _putNode(node, cb) 
  {
    assert(node instanceof TrieNode, `Trie _putNode, node should be an instance of TrieNode, now is ${typeof node}`);

    const hash = node.hash()
    const serialized = node.serialize()
    this.db.put(hash, serialized, cb)
  }

  /**
   * @param {Buffer} key - the search key
   * @param {Function} cb - It is given the following arguments
   *   err - any errors encontered
   *   node - the last node found
   *   keyRemainder - the remaining key nibbles not accounted for
   *   stack - an array of nodes that forms the path to node we are searching for
   */
  findPath(targetKey, cb) 
  {
    assert(Buffer.isBuffer(targetKey), `Trie targetKey, targetKey should be an Buffer, now is ${typeof targetKey}`)

    const stack = []

    targetKey = bufferToNibbles(targetKey)

    // begin to walk trie with the specified root
    this._walkTrie(this.root, processNode, cb)

    /**
     * @param {Array | Buffer} nodeRef - Buffer对应的是节点哈西，Array对应的是节点序列化数据
     * @param {TrieNode} node 当前节点
     * @param {Array} keyProgress 当前已经处理的key（不包含node的key）
     * @param {cb} walkController
     */
    function processNode(nodeRef, node, keyProgress, walkController)
    {
      assert(node instanceof TrieNode, `Trie findPath processNode, node should be an instance of TrieNode, now is ${typeof node}`)
      assert(Array.isArray(keyProgress), `Trie findPath processNode, keyProgress should be an Array, now is ${typeof keyProgress}`)

      const nodeKey = node.key || []
      const keyRemainder = targetKey.slice(matchingNibbleLength(keyProgress, targetKey))
      const matchingLen = matchingNibbleLength(keyRemainder, nodeKey)

      stack.push(node)

      if(node.type === 'branch') 
      {
        if (keyRemainder.length === 0) 
        {
          // 返回targetKey对应的节点
          walkController.return(null, node, [], stack);
        } 
        else 
        {
          // 获取分支节点上对应槽位的内容
          const branchIndex = keyRemainder[0]
          const branchNode = node.getValue(branchIndex)
          if(branchNode) 
          {
            // 继续寻找target对应的节点
            walkController.only(branchIndex)
          } 
          else 
          {
            // 对应槽位没有内容，无法继续寻找
            walkController.return(null, null, keyRemainder, stack)
          }
        }
      } 
      else if(node.type === 'leaf') 
      {
        if(doKeysMatch(keyRemainder, nodeKey)) 
        {
          // 返回targetKey对应的节点
          walkController.return(null, node, [], stack)
        } 
        else 
        {
          // 没有找到目标key对应的节点
          walkController.return(null, null, keyRemainder, stack)
        }
      } 
      else if(node.type === 'extention') 
      {
        if(matchingLen !== nodeKey.length) 
        {
          // keyRemainder无法通过当前扩展节点往下寻找
          walkController.return(null, null, keyRemainder, stack)
        } 
        else 
        {
          // 继续寻找目标key对应的节点
          walkController.next()
        }
      }
    }
  }

  /*
   * Finds all nodes with value
   * @param {Function} onFound 
   */
  _findValueNodes(onFound, cb) 
  {
    this._walkTrie(this.root, (nodeRef, node, keyProgress, walkController) => {
      // 已经处理的key
      let fullKey = keyProgress

      // 注意！！！分支节点的key属性返回空，因此这里需要区分分支节点和键值对节点
      if(node.key) 
      {
        fullKey = keyProgress.concat(node.key)
      }

      if(node.type === 'leaf') 
      {
        onFound(nodeRef, node, fullKey, walkController.next);
      } 
      else if(node.type === 'branch' && node.value) 
      {
        onFound(nodeRef, node, fullKey, walkController.next);
      } 
      else 
      {
        walkController.next()
      }
    }, cb)
  }

  /*
   * Finds all nodes that are stored directly in the db(some nodes are stored raw inside other nodes)
   */
  _findDbNodes(onFound, cb) 
  {
    this._walkTrie(this.root, (nodeRef, node, key, walkController) => {
      if(TrieNode.isRawNode(nodeRef))
      {
        return walkController.next()
      } 
     
      onFound(nodeRef, node, key, walkController.next)
    }, cb)
  }

  /**
   * @param {Buffer} key
   * @param {Buffer} value
   * @param {Array} keyRemainder
   * @param {Array} stack
   * @param {Function} cb
   */
  _updateNode(key, value, keyRemainder, stack, cb) 
  {
    assert(Buffer.isBuffer(key), `Trie _updateNode, key should be an Buffer, now is ${typeof key}`)
    assert(Buffer.isBuffer(value), `Trie _updateNode, value should be an Buffer, now is ${typeof value}`)
    assert(Array.isArray(keyRemainder), `Trie _updateNode, keyRemainder should be an Array, now is ${typeof keyRemainder}`)
    assert(Array.isArray(stack), `Trie _updateNode, stack should be an Array, now is ${typeof stack}`)

    const toSave = []
    const lastNode = stack.pop()

    key = bufferToNibbles(key)

    if(lastNode.type === 'leaf' && keyRemainder.length === 0) 
    {
      lastNode.value = value
      stack.push(lastNode)

      return this._saveStack(key, stack, toSave, cb)
    }

    if(lastNode.type === 'branch') 
    {
      stack.push(lastNode);

      if(keyRemainder.length === 0) 
      {
        lastNode.value = value
      } 
      else 
      {
        keyRemainder.shift()

        // 添加一个叶子节点
        const newLeaf = new TrieNode('leaf', keyRemainder, value)
        stack.push(newLeaf)
      }

      return this._saveStack(key, stack, toSave, cb)
    }
   
    // 最后一个节点是键值对节点
    const lastKey = lastNode.key
    const matchingLength = matchingNibbleLength(lastKey, keyRemainder)
    const newBranchNode = new TrieNode('branch')

    // lastNode的key和的keyRemainder有部分匹配
    if(matchingLength !== 0)
    {
      const newKey = lastNode.key.slice(0, matchingLength)

      // 添加一个扩展节点
      const newExtNode = new TrieNode('extention', newKey, null)
      stack.push(newExtNode)

      //
      lastKey.splice(0, matchingLength)
      keyRemainder.splice(0, matchingLength)
    }

    // 添加一个分支节点
    stack.push(newBranchNode)

    // 处理最后一个节点
    if(lastKey.length !== 0) 
    {
      // 获取分支节点的槽位
      const branchKey = lastKey.shift();

      // 重新定义lastNode的key
      lastNode.key = lastKey
      
      // 获取lastNode的哈希，toSave中记录的是将lastNode放入数据库的操作
      const formatedNode = this._formatNode(lastNode, false, toSave)

      // 将lastNode放入新创建的分支节点中
      newBranchNode.setValue(branchKey, formatedNode)
    } 
    else 
    {
      newBranchNode.value = lastNode.value
    }

    // 处理新加入的节点
    if (keyRemainder.length !== 0) 
    {
      keyRemainder.shift()

      // 添加一个叶子节点
      const newLeafNode = new TrieNode('leaf', keyRemainder, value)
      stack.push(newLeafNode)
    } 
    else 
    {
      newBranchNode.value = value
    }

    // 保存修改过的节点
    this._saveStack(key, stack, toSave, cb)
  }

  /**
   * @param {Buffer} root 
   * @param {Functioin} onNode 遍历节点的控制函数，用来制定遍历策略
   * @param {Functioin} onDone
   */
  _walkTrie(root, onNode, onDone) 
  {
    assert(Buffer.isBuffer(root), `Trie _walkTrie, root should be an Buffer, now is ${typeof root}`)

    const self = this
  
    onDone = onDone || function () {}

    let aborted = false
    let returnValues = []

    if(root.toString('hex') === utils.SHA3_RLP.toString('hex')) 
    {
      return onDone()
    }

    this._lookupNode(root, (e, node) => {
      if(e)
      {
        return onDone(e)
      }

      processNode(root, node, null, err => {
        if(err) 
        {
          return onDone(err)
        }

        onDone.apply(null, returnValues)
      })
    })

    // the maximum pool size should be high enough to utilise the parallelizability of reading nodes from disk and
    // low enough to utilize the prioritisation of node lookup.
    const maxPoolSize = 500
    const taskExecutor = new PrioritizedTaskExecutor(maxPoolSize)

    /**
     * @param {Buffer | Array} nodeRef
     * @param {TrieNode} node 当前节点
     * @param {Array} keyProgress 当前处理的keyProgress（不包含当前节点的key）
     * @param {Function} cb
     */
    function processNode(nodeRef, node, keyProgress, cb) 
    {
      if(!node || aborted) 
      {
        return cb()
      }

      let stopped = false
      keyProgress = keyProgress || []

      // 遍历控制接口（相当于是一个迭代器，用于控制遍历的策略）
      const walkController = {
        stop: function() {
          stopped = true
          cb()
        },
        return: function() {
          aborted = true
          returnValues = arguments
          cb()
        },
        next: function() {
          if(aborted || stopped) 
          {
            return cb()
          }

          const children = node.getChildren()
          async.forEachOf(children, (childData, index, cb) => {
            const keyExtension = childData[0]
            const childRef = childData[1]
            const childKey = keyProgress.concat(keyExtension)
            // 继续遍历
            const priority = childKey.length
            taskExecutor.execute(priority, taskCallback => {
              self._lookupNode(childRef, (e, childNode) => {
                if(e) 
                {
                  return cb(e)
                }

                taskCallback()
                processNode(childRef, childNode, childKey, cb)
              })
            })
          }, cb)
        },
        only: function (childIndex) {
          const childRef = node.getValue(childIndex)
          const childKey = keyProgress.slice()
          childKey.push(childIndex)
          // 继续遍历
          const priority = childKey.length
          taskExecutor.execute(priority, taskCallback => {
            self._lookupNode(childRef, (e, childNode) => {
              if (e) {
                return cb(e, node)
              }
              taskCallback()
              processNode(childRef, childNode, childKey, cb)
            })
          })
        }
      }

      onNode(nodeRef, node, keyProgress, walkController)
    }
  }

  /**
   * @param {Array} key
   * @param {Array} stack - nodes in the path to the node which represent the key-value
   * @param {Array} opStack - a stack of db operations to commit at the end of this funciton
   * @param {Function} cb
   */
  _saveStack(key, stack, opStack, cb)
  {
    assert(Array.isArray(key), `Trie _saveStack, key should be an Array, now is ${typeof key}`)
    assert(Array.isArray(stack), `Trie _saveStack, stack should be an Array, now is ${typeof stack}`)
    assert(Array.isArray(opStack), `Trie _saveStack, opStack should be an Array, now is ${typeof opStack}`)

    // 可以是哈希值，也可以是节点数据
    let lastRoot

    while(stack.length) 
    {
      const node = stack.pop()
      if(node.type === 'leaf')
      {
        key.splice(key.length - node.key.length)
      } 
      else if(node.type === 'extention') 
      {
        key.splice(key.length - node.key.length)
        if(lastRoot) 
        {
          node.value = lastRoot
        }
      } 
      else if(node.type === 'branch') 
      {
        if(lastRoot) 
        {
          const branchKey = key.pop();
          node.setValue(branchKey, lastRoot)
        }
      }
      // 将存储node的操作放入opStack中
      lastRoot = this._formatNode(node, stack.length === 0, opStack)
    }

    // 重新定义根节点哈西
    if(lastRoot) 
    {
      this.root = lastRoot
    }

    // 进行数据库操作
    this.db.batch(opStack, cb)
  }

  /**
   * @param {Buffer} key
   * @param {Array} stack
   */
  _deleteNode(key, stack, cb)
  {
    assert(Buffer.isBuffer(key), `Trie _deleteNode, key should be an Buffer, now is ${typeof key}`)
    assert(Array.isArray(stack), `Trie _deleteNode, stack should be an Array, now is ${typeof stack}`)

    key = bufferToNibbles(key)

    /**
     * @param {Array} key
     * @param {Char} branchKey - 删除的分支节点上仅有的有效槽位对应的key
     * @param {TrieNode} branchNode - 删除的分支节点上仅有的有效槽位对应的子节点
     * @param {TrieNode} parentNode - 删除的分支节点的父节点
     * @param {Array} stack
     */
    function processBranchNode(key, branchKey, branchNode, parentNode, stack) 
    {
      assert(Array.isArray(key), `Trie _deleteNode processBranchNode, key should be an Array, now is ${typeof key}`)
      assert(typeof branchKey === 'number', `Trie _deleteNode processBranchNode, branchKey should be a Number, now is ${typeof branchKey}`)
      assert(branchNode instanceof TrieNode, `Trie _deleteNode processBranchNode, branchNode should be an instance of TrieNode, now is ${typeof branchNode}`)
      if(parentNode)
      {
        assert(parentNode instanceof TrieNode, `Trie _deleteNode processBranchNode, parentNode should be an instance of TrieNode, now is ${typeof parentNode}`)
      }
      assert(Array.isArray(stack), `Trie _deleteNode processBranchNode, stack should be an Array, now is ${typeof stack}`)

      const branchNodeKey = branchNode.key
      if(parentNode && parentNode.type !== 'branch') 
      {
        // parentNode为扩展节点
        let parentKey = parentNode.key

        if(branchNode.type === 'branch') 
        {
          // branchNode为分支节点（删除的分支节点有效槽位上的key提升到parentNode）
          parentKey.push(branchKey)
          // 重新设置key值
          key.push(branchKey)
          // 设置parentNode的key值
          parentNode.key = parentKey
          stack.push(parentNode)
        } 
        else 
        {
          // branchNode为键值对节点（删除的分支节点有效槽位上的key结合branchNode和parentNode合并为一个键值对节点）
          branchNodeKey.unshift(branchKey)
          key = key.concat(branchNodeKey)
          parentKey = parentKey.concat(branchNodeKey)
          branchNode.key = parentKey
        }

        stack.push(branchNode)
      }
      else
      {
        // 父节点存在的情况下，需要更新父节点
        if(parentNode) 
        {
          stack.push(parentNode)
        }

        // branchNode为分支节点（parentNode不存在或者parentNode为分支节点）
        if(branchNode.type === 'branch') 
        {
          // 创建一个扩展节点连接parentNode和branchNode
          const extentionNode = new TrieNode('extention', [branchKey], null)
          stack.push(extentionNode)
          // 更新key值
          key.push(branchKey)
        } 
        else
        {
          // branchNode是一个键值对节点（删除的分支节点有效槽位上的key下放到branchNode）
          branchNodeKey.unshift(branchKey)
          branchNode.key = branchNodeKey
          // 更改key值
          key = key.concat(branchNodeKey)
        }
        stack.push(branchNode)
      }

      return key
    }

    let lastNode = stack.pop()
    let parentNode = stack.pop()
    const opStack = []

    if(!parentNode) 
    {
      // 删除根节点（实际上我们并不会去删除根节点）
      this.root = utils.SHA3_RLP

      return cb()
    } 
   
    if(lastNode.type === 'branch') 
    {
      // 删除分支节点（实际上只是删除16槽位对应的值）
      lastNode.value = null;

      stack.push(parentNode)
      stack.push(lastNode)

      return this._saveStack(key, stack, opStack, cb)
    } 
   
    // 删除键值对节点（这里只是删除key值，并不会真的去删除这个节点）
    const lastNodeKey = lastNode.key
    key.splice(key.length - lastNodeKey.length)

    // 重新设置父节点的槽值
    parentNode.setValue(key.pop(), null)

    // 
    lastNode = parentNode
    parentNode = stack.pop()

    // nodes on the branch
    const branchNodes = []

    // 统计分支节点的有效槽位的数量
    lastNode.raw.forEach((node, branchKey) => {
      const val = lastNode.getValue(branchKey)

      if(val) 
      {
        branchNodes.push([branchKey, val])
      }
    })

    // 分支节点的有效槽位只有一个，删除分支节点，并且进行父节点和子节点互连
    if(branchNodes.length === 1) 
    {
      const branchNodeKey = branchNodes[0][0]
      const branchNode = branchNodes[0][1]

      this._lookupNode(branchNode, (e, foundNode) => {
        if(e)
        {
          return cb(e)
        }

        // 删除分支节点（实际上只是删除key值，并不会真的去删除对应的节点），并且进行父节点和子节点互连操作
        key = processBranchNode(key, branchNodeKey, foundNode, parentNode, stack, opStack)

        this._saveStack(key, stack, opStack, cb)
      })
    } 
    else 
    {
      // 分支节点的有效槽位数量大于一个，只需要更新分支节点
      if(parentNode)
      {
        stack.push(parentNode)
      }

      stack.push(lastNode)

      this._saveStack(key, stack, opStack, cb)
    }
  }

  /**
   * @param {Buffer} key
   * @param {Buffer} value
   * @param {Function} cb
   */
  _createInitialNode(key, value, cb)
  {
    assert(Buffer.isBuffer(key), `Trie _createInitialNode, key should be an Buffer, now is ${typeof key}`)
    assert(Buffer.isBuffer(value), `Trie _createInitialNode, value should be an Buffer, now is ${typeof value}`)

    const newNode = new TrieNode('leaf', key, value)
    this.root = newNode.hash()
    this._putNode(newNode, cb)
  }

  /**
   * @param {TrieNode} node
   * @param {Boolean} topLevel
   * @param {Array} opStack
   */
  _formatNode(node, topLevel, opStack)
  {
    assert(node instanceof TrieNode, `Trie _formatNode, node should be an instance of TrieNode, now is ${typeof node}`);
    assert(typeof topLevel === 'boolean', `Trie _formatNode, topLevel should be an Boolean, now is ${typeof topLevel}`);
    assert(Array.isArray(opStack), `Trie _formatNode, opStack should be an Array, now is ${typeof opStack}`);

    const rlpNode = node.serialize()

    // 如果node的序列化数据大于32或者node是根节点，返回哈西值（这种情况下需要往数据库中新增一个节点）
    if(rlpNode.length >= 32 || topLevel) 
    {
      const hashRoot = node.hash()

      opStack.push({
        type: 'put',
        key: hashRoot,
        value: rlpNode
      })

      return hashRoot
    }

    // node的序列化数据较小，返回数据本身（这种情况下节点数据存储在其他节点中）
    return node.raw
  }

  createReadStream() 
  {
    return new ReadStream(this)
  }

  copy()
  {
    const db = this.db.copy()
    return new Trie(db, this.root)
  }

  /**
   * Checks if a given root exists
   * @param {Buffer} root
   * @param {Function} cb
   */
  checkRoot(root, cb)
  {
    assert(Buffer.isBuffer(root), `Trie checkRoot, root should be an Buffer, now is ${typeof root}`)

    this._lookupNode(root, (e, value) => {
      cb(null, !!value)
    })
  }
}

module.exports = Trie;