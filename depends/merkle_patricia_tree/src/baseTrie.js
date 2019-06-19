const assert = require('assert')
const async = require('async')
const rlp = require('rlp')
const ethUtil = require('ethereumjs-util')
const semaphore = require('semaphore')
const DB = require('./db')
const TrieNode = require('./trieNode')
const ReadStream = require('./readStream')
const PrioritizedTaskExecutor = require('./prioritizedTaskExecutor')
const { callTogether } = require('./util/async')
const { stringToNibbles, matchingNibbleLength, doKeysMatch } = require('./util/nibbles')

/**
 * @class Trie
 * @public
 */
module.exports = class Trie {
  /**
   * @param {Object} [db] An instance of `DB`. If the db is `null` or left undefined, then the trie will be stored in memory via [memdown](https://github.com/Level/memdown)
   * @param {Buffer|String} [root] A hex `String` or `Buffer` for the root of a previously stored trie
   */
  constructor (db, root) {
    const self = this
    this.EMPTY_TRIE_ROOT = ethUtil.SHA3_RLP
    this.sem = semaphore(1)

    this.db = db || new DB()

    Object.defineProperty(this, 'root', {
      set (value) {
        if (value) {
          value = ethUtil.toBuffer(value)
          assert(value.length === 32, 'Invalid root length. Roots are 32 bytes')
        } else {
          value = self.EMPTY_TRIE_ROOT
        }

        this._root = value
      },
      get () {
        return this._root
      }
    })

    this.root = root
  }

  /**
   * @param {Buffer|String} key - the key to search for
   * @param {Function} cb
   */
  get (key, cb) {
    key = ethUtil.toBuffer(key)

    this.findPath(key, (err, node, remainder, stack) => {
      let value = null

      if (node) 
      {
        value = node.value
      }

      cb(err, value)
    })
  }

  /**
   * @param {Buffer|String} key
   * @param {Buffer|String} value
   * @param {Function} cb
   */
  put (key, value, cb) {
    key = ethUtil.toBuffer(key)
    value = ethUtil.toBuffer(value)

    if (!value || value.toString() === '') 
    {
      this.del(key, cb)
    } 
    else 
    {
      cb = callTogether(cb, this.sem.leave)

      this.sem.take(() => {
        if (this.root.toString('hex') !== ethUtil.SHA3_RLP.toString('hex')) 
        {
          this.findPath(key, (err, foundValue, keyRemainder, stack) => {
            if (err) 
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
  }

  /**
   * @param {Buffer|String} key
   * @param {Function} cb
   */
  del (key, cb) {
    key = ethUtil.toBuffer(key)
    cb = callTogether(cb, this.sem.leave)

    this.sem.take(() => {
      this.findPath(key, (err, foundValue, keyRemainder, stack) => {
        if (err) 
        {
          return cb(err)
        }
        if (foundValue) 
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

  _lookupNode (node, cb) {
    if (TrieNode.isRawNode(node)) 
    {
      // 指定了TrieNode的元数据，返回TrieNode对象
      cb(null, new TrieNode(node))
    } 
    else 
    {
      // 从数据库中寻找指定root的节点
      this.db.get(node, (err, value) => {
        if (err) 
        {
          throw err
        }

        if (value) 
        {
          value = new TrieNode(rlp.decode(value))
        } 
        else 
        {
          err = new Error('Missing node in DB')
        }

        cb(err, value)
      })
    }
  }

  _putNode (node, cb) {
    const hash = node.hash()
    const serialized = node.serialize()
    this.db.put(hash, serialized, cb)
  }

  /**
   * Tries to find a path to the node for the given key, It returns a `stack` of nodes to the closet node
   * @param {String|Buffer} - key - the search key
   * @param {Function} - cb - the callback function. It is given the following arguments
   *  - err - any errors encontered
   *  - node - the last node found
   *  - keyRemainder - the remaining key nibbles not accounted for
   *  - stack - an array of nodes that forms the path to node we are searching for
   */
  findPath (targetKey, cb) {
    const stack = []

    // convert key to nibble array
    targetKey = stringToNibbles(targetKey)

    // begin to walk trie with the specified root
    this._walkTrie(this.root, processNode, cb)

    /**
     * @param {} nodeRef 节点哈西
     * @param {} node 当前节点
     * @param {} keyProgress 当前已经处理的key（不包含node的key）
     * @param {cb} walkController
     */
    function processNode (nodeRef, node, keyProgress, walkController) {
      // 获取当前node的key
      const nodeKey = node.key || []
      // 获取未处理的目标key
      const keyRemainder = targetKey.slice(matchingNibbleLength(keyProgress, targetKey))
      // 判断未处理的key与当前node的key匹配的长度
      const matchingLen = matchingNibbleLength(keyRemainder, nodeKey)

      // 记录匹配路径上的节点
      stack.push(node)

      if (node.type === 'branch') 
      {
        // 目标key已经全部处理完
        if (keyRemainder.length === 0) 
        {
          // 找到目标key对应的节点
          walkController.return(null, node, [], stack)
        } 
        else 
        {
          // 获取分支节点上对应槽位的内容
          const branchIndex = keyRemainder[0]
          const branchNode = node.getValue(branchIndex)
          if (!branchNode) 
          {
            // 对应槽位没有内容，无法继续寻找
            walkController.return(null, null, keyRemainder, stack)
          } 
          else 
          {
            // 继续寻找目标key对应的节点
            walkController.only(branchIndex)
          }
        }
      } 
      else if (node.type === 'leaf') 
      {
        if (doKeysMatch(keyRemainder, nodeKey)) 
        {
          // 找到目标key对应的节点
          walkController.return(null, node, [], stack)
        } 
        else 
        {
          // 没有找到目标key对应的节点
          walkController.return(null, null, keyRemainder, stack)
        }
      } 
      else if (node.type === 'extention') 
      {
        if (matchingLen !== nodeKey.length) 
        {
          // 剩余的未处理的目标key与当前节点的key不匹配，无法继续往下寻找
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
   * Finds all nodes that store k,v values
   */
  _findNode (key, root, stack, cb) {
    this.findPath(key, () => {
      cb.apply(null, arguments)
    })
  }

  /*
   * Finds all nodes with value
   * @param {Function} onFound 
   */
  _findValueNodes (onFound, cb) {
    this._walkTrie(this.root, (nodeRef, node, key, walkController) => {
      let fullKey = key

      if (node.key) 
      {
        fullKey = key.concat(node.key)
      }

      if (node.type === 'leaf') 
      {
        onFound(nodeRef, node, fullKey, walkController.next);
      } 
      else if (node.type === 'branch' && node.value) 
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
  _findDbNodes (onFound, cb) {
    this._walkTrie(this.root, (nodeRef, node, key, walkController) => {
      if (TrieNode.isRawNode(nodeRef)) 
      {
        walkController.next()
      } 
      else 
      {
        onFound(nodeRef, node, key, walkController.next)
      }
    }, cb)
  }

  /**
   * @param {Buffer} key
   * @param {Buffer | String} value
   * @param {Array} keyRemainder 未处理的目标key
   * @param {Array} stack - 路径上的节点
   * @param {Function} cb
   */
  _updateNode (key, value, keyRemainder, stack, cb) 
  {
    const toSave = []
    const lastNode = stack.pop()

    // convert key to nibble array
    key = stringToNibbles(key)

    if (lastNode.type === 'leaf' && keyRemainder.length === 0) 
    {
      lastNode.value = value
      stack.push(lastNode)

      return this._saveStack(key, stack, toSave, cb)
    }

    if (lastNode.type === 'branch') 
    {
      stack.push(lastNode);

      if (keyRemainder.length === 0) 
      {
        lastNode.value = value
      } 
      else 
      {
        keyRemainder.shift()

        // 添加一个叶子节点，对应的branchIndex会在_saveStack进行赋值
        const newLeaf = new TrieNode('leaf', keyRemainder, value)
        stack.push(newLeaf)
      }

      return this._saveStack(key, stack, toSave, cb)
    }
   
    // 最后一个节点是键值对节点（叶子节点或者扩展节点），并且叶子节点的key值与新加入的节点的key值不匹配，这时候需要创建一个分支节点，用来间接或者直接存储最后一个节点和新加入的节点
    const lastKey = lastNode.key
    const matchingLength = matchingNibbleLength(lastKey, keyRemainder)
    const newBranchNode = new TrieNode('branch')

    // 最后一个节点的key和未处理的目标key有部分匹配
    if (matchingLength !== 0) 
    {
      // 获取部分匹配的key值
      const newKey = lastNode.key.slice(0, matchingLength)

      // 通过部分匹配的key值创建一个扩展节点，扩展节点的子节点的哈希会在_saveStack进行赋值
      const newExtNode = new TrieNode('extention', newKey, value)
      stack.push(newExtNode)

      //
      lastKey.splice(0, matchingLength)
      keyRemainder.splice(0, matchingLength)
    }

    // 添加一个分支节点
    stack.push(newBranchNode)

    // 处理最后一个节点
    if (lastKey.length !== 0) 
    {
      // 获取分支节点的槽位
      const branchKey = lastKey.shift()；

      if (lastNode.type === 'leaf') 
      {
        // 重新定义lastNode的key
        lastNode.key = lastKey
        
        // 获取lastNode的哈希，toSave中记录的是将lastNode放入数据库的操作
        const formatedNode = this._formatNode(lastNode, false, toSave)

        // 添加一个叶子节点
        newBranchNode.setValue(branchKey, formatedNode)
      } 
      else 
      {
        // toSave中存储删除lastNode的操作
        this._formatNode(lastNode, false, true, toSave)

        // 添加一个扩展节点，漏掉的key会在_saveStack进行赋值
        newBranchNode.setValue(branchKey, lastNode.value)
      }
    } 
    else 
    {
      newBranchNode.value = lastNode.value
    }

    // 处理新加入的节点
    if (keyRemainder.length !== 0) 
    {
      keyRemainder.shift()

      // 添加一个叶子节点，对应的branchIndex会在_saveStack进行赋值
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
   * @param {} root 
   * @param {Functioin} onNode 遍历节点的控制函数，用来制定遍历策略以及调用onDone函数返回遍历结果
   * @param {Functioin} onDone
   */
  _walkTrie (root, onNode, onDone) {
    const self = this
    root = root || this.root
    onDone = onDone || function () {}
    let aborted = false
    let returnValues = []

    if (root.toString('hex') === ethUtil.SHA3_RLP.toString('hex')) 
    {
      return onDone()
    }

    this._lookupNode(root, (e, node) => {
      if (e) 
      {
        return onDone(e, node)
      }
      processNode(root, node, null, err => {
        if (err) 
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
     * @param {} nodeRef 节点对应的哈希值
     * @param {} node 当前节点
     * @param {} key 当前处理的key（不包含当前节点的key）
     * @param {} cb
     */
    function processNode (nodeRef, node, key, cb) {
      if (!node || aborted) 
      {
        return cb()
      }

      let stopped = false
      key = key || []

      // 遍历控制接口（相当于是一个迭代器，用于控制遍历的方向）
      const walkController = {
        stop: function () {
          stopped = true
          cb()
        },
        return: function () {
          aborted = true
          returnValues = arguments
          cb()
        },
        next: function () {
          if (aborted || stopped) 
          {
            return cb()
          }

          // 获取子节点
          const children = node.getChildren()
          async.forEachOf(children, (childData, index, cb) => {
            // 获取key(nibble array)
            const keyExtension = childData[0]
            // 获取子节点的哈西
            const childRef = childData[1]
            // 获取完整的key
            const childKey = key.concat(keyExtension)
            // 扩展节点的优先级要大于分支节点
            const priority = childKey.length
            // 继续遍历
            taskExecutor.execute(priority, taskCallback => {
              self._lookupNode(childRef, (e, childNode) => {
                if (e) 
                {
                  return cb(e, node)
                }

                taskCallback()
                processNode(childRef, childNode, childKey, cb)
              })
            })
          }, cb)
        },
        // 当前节点为分支节点，调用only函数继续往下遍历
        only: function (childIndex) {
          // 获取对应槽位上子节点的哈希
          const childRef = node.getValue(childIndex)
          // 获取完整的key
          const childKey = key.slice()
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

      onNode(nodeRef, node, key, walkController)
    }
  }

  /**
   * @private
   * @param {Array} key - the key. Should follow the stack
   * @param {Array} stack - a stack of nodes to the value given by the key
   * @param {Array} opStack - a stack of levelup operations to commit at the end of this funciton
   * @param {Function} cb
   */
  _saveStack (key, stack, opStack, cb) {
    let lastRoot

    // update nodes
    while (stack.length) 
    {
      const node = stack.pop()
      if (node.type === 'leaf') 
      {
        key.splice(key.length - node.key.length)
      } 
      else if (node.type === 'extention') 
      {
        key.splice(key.length - node.key.length)
        if (lastRoot) 
        {
          node.value = lastRoot
        }
      } 
      else if (node.type === 'branch') 
      {
        if (lastRoot) 
        {
          const branchKey = key.pop();
          node.setValue(branchKey, lastRoot)
        }
      }
      lastRoot = this._formatNode(node, stack.length === 0, opStack)
    }

    if (lastRoot) 
    {
      this.root = lastRoot
    }

    this.db.batch(opStack, cb)
  }

  /**
   * @param {Array} key
   * @param {Array} stack
   */
  _deleteNode (key, stack, cb) {
    /**
     * @param {Array} key
     * @param {Char} branchKey，删除的分支节点上仅有的有效槽位对应的key
     * @param {} branchNode，删除的分支节点上仅有的有效槽位对应的子节点哈西
     * @param {} parentNode，删除的分支节点的父节点
     */
    function processBranchNode (key, branchKey, branchNode, parentNode, stack) {
      const branchNodeKey = branchNode.key
      if (!parentNode || parentNode.type === 'branch') 
      {
        // 父节点存在的情况下，需要更新父节点
        if (parentNode) 
        {
          stack.push(parentNode)
        }

        if (branchNode.type === 'branch') 
        {
          // 创建一个扩展节点连接parentNode和branchNode
          const extentionNode = new TrieNode('extention', [branchKey], null)
          stack.push(extentionNode)
          // 更新key值
          key.push(branchKey)
        } 
        else 
        {
          // branchNode是一个键值对节点，将删除的分支节点的key值放入branchNode
          branchNodeKey.unshift(branchKey)
          branchNode.key = branchNodeKey

          // 相当于key = key.concat(branchNodeKey);
          branchNodeKey.unshift(0)
          branchNodeKey.unshift(key.length)
          key.splice.apply(key, branchNodeKey)
        }
        stack.push(branchNode)
      } 
      else 
      {
        // parentNode为扩展节点
        let parentKey = parentNode.key

        if (branchNode.type === 'branch') 
        {
          // branchNode为分支节点（删除的分支的分支节点的key向上提升到parentNode）
          parentKey.push(branchKey)
          // 重新设置key值
          key.push(branchKey)
          // 设置parentNode的key值
          parentNode.key = parentKey
          stack.push(parentNode)
        } 
        else 
        {
          // branchNode为键值对节点（branchNode和parentNode合并为一个键值对节点）
          branchNodeKey.unshift(branchKey)
          key = key.concat(branchNodeKey)
          parentKey = parentKey.concat(branchNodeKey)
          branchNode.key = parentKey
        }

        stack.push(branchNode)
      }

      return key
    }

    let lastNode = stack.pop()
    let parentNode = stack.pop()
    const opStack = []

    if (!Array.isArray(key)) 
    {
      // convert key to nibbles
      key = stringToNibbles(key)
    }

    if (!parentNode) 
    {
      // 删除根节点
      this.root = this.EMPTY_TRIE_ROOT
      cb()
    } 
    else 
    {
      if (lastNode.type === 'branch') 
      {
        // 删除分支节点
        lastNode.value = null
      } 
      else
      {
        // 删除叶子节点
        const lastNodeKey = lastNode.key
        key.splice(key.length - lastNodeKey.length)
        // opStack中记录删除lastNode的操作
        this._formatNode(lastNode, false, true, opStack)
        // 重新设置父节点的槽值
        parentNode.setValue(key.pop(), null)

        //
        lastNode = parentNode
        parentNode = stack.pop()
      }

      // nodes on the branch
      const branchNodes = []

      // 统计分支节点的有效槽位的数量
      lastNode.raw.forEach((node, i) => {
        const val = lastNode.getValue(i)

        if (val) {
          branchNodes.push([i, val])
        }
      })

      // 分支节点的有效槽位只有一个，删除分支节点
      if (branchNodes.length === 1) 
      {
        // 子节点哈西
        const branchNode = branchNodes[0][1]

        // 分支节点key
        const branchNodeKey = branchNodes[0][0]

        this._lookupNode(branchNode, (e, foundNode) => {
          if (e) 
          {
            return cb(e, foundNode)
          }

          // 删除分支节点
          key = processBranchNode(key, branchNodeKey, foundNode, parentNode, stack, opStack)
          this._saveStack(key, stack, opStack, cb)
        })
      } 
      else 
      {
        // 分支节点的有效槽位数量大于一个，只需要更新分支节点
        if (parentNode) {
          stack.push(parentNode)
        }

        stack.push(lastNode)
        this._saveStack(key, stack, opStack, cb)
      }
    }
  }

  // Creates the initial node from an empty tree
  _createInitialNode (key, value, cb) {
    const newNode = new TrieNode('leaf', key, value)
    this.root = newNode.hash()
    this._putNode(newNode, cb)
  }

  // formats node to be saved by levelup.batch.
  // returns either the hash that will be used key or the rawNode
  _formatNode (node, topLevel, remove, opStack) {
    if (arguments.length === 3) {
      opStack = remove
      remove = false
    }

    const rlpNode = node.serialize()

    if (rlpNode.length >= 32 || topLevel) 
    {
      const hashRoot = node.hash()

      if (remove && this.isCheckpoint) 
      {
        opStack.push({
          type: 'del',
          key: hashRoot
        })
      } 
      else
      {
        opStack.push({
          type: 'put',
          key: hashRoot,
          value: rlpNode
        })
      }

      return hashRoot
    }

    return node.raw
  }

  /**
   * The `data` event is given an `Object` hat has two properties; the `key` and the `value`. Both should be Buffers.
   * @method createReadStream
   * @memberof Trie
   * @return {stream.Readable} Returns a [stream](https://nodejs.org/dist/latest-v5.x/docs/api/stream.html#stream_class_stream_readable) of the contents of the `trie`
   */
  createReadStream () {
    return new ReadStream(this)
  }

  // creates a new trie backed by the same db
  // and starting at the same root
  copy () {
    const db = this.db.copy()
    return new Trie(db, this.root)
  }

  /**
   * The given hash of operations (key additions or deletions) are executed on the DB
   * @method batch
   * @memberof Trie
   * @example
   * var ops = [
   *    { type: 'del', key: 'father' }
   *  , { type: 'put', key: 'name', value: 'Yuri Irsenovich Kim' }
   *  , { type: 'put', key: 'dob', value: '16 February 1941' }
   *  , { type: 'put', key: 'spouse', value: 'Kim Young-sook' }
   *  , { type: 'put', key: 'occupation', value: 'Clown' }
   * ]
   * trie.batch(ops)
   * @param {Array} ops
   * @param {Function} cb
   */
  batch (ops, cb) {
    async.eachSeries(ops, (op, cb2) => {
      if (op.type === 'put') {
        this.put(op.key, op.value, cb2)
      } else if (op.type === 'del') {
        this.del(op.key, cb2)
      } else {
        cb2()
      }
    }, cb)
  }

  /**
   * Checks if a given root exists
   * @method checkRoot
   * @memberof Trie
   * @param {Buffer} root
   * @param {Function} cb
   */
  checkRoot (root, cb) {
    root = ethUtil.toBuffer(root)
    this._lookupNode(root, (e, value) => {
      cb(null, !!value)
    })
  }
}
