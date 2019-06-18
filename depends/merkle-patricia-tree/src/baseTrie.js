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
 * Use `require('merkel-patricia-tree')` for the base interface. In Ethereum applications
 * stick with the Secure Trie Overlay `require('merkel-patricia-tree/secure')`.
 * The API for the raw and the secure interface are about the same
 * @class Trie
 * @public
 * @param {Object} [db] An instance of `DB`.
 * If the db is `null` or left undefined, then the trie will be stored in memory via [memdown](https://github.com/Level/memdown)
 * @param {Buffer|String} [root] A hex `String` or `Buffer` for the root of a previously stored trie
 * @prop {Buffer} root The current root of the `trie`
 * @prop {Buffer} EMPTY_TRIE_ROOT the Root for an empty trie
 */
module.exports = class Trie {
  /**
   * @param db
   * @param root
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
   * Gets a value given a `key`
   * @method get
   * @memberof Trie
   * @param {Buffer|String} key - the key to search for
   * @param {Function} cb A callback `Function` which is given the arguments `err` - for errors that may have occured and `value` - the found value in a `Buffer` or if no value was found `null`
   */
  get (key, cb) {
    key = ethUtil.toBuffer(key)

    this.findPath(key, (err, node, remainder, stack) => {
      let value = null

      if (node && remainder.length === 0) {
        value = node.value
      }

      cb(err, value)
    })
  }

  /**
   * Stores a given `value` at the given `key`
   * @method put
   * @memberof Trie
   * @param {Buffer|String} key
   * @param {Buffer|String} Value
   * @param {Function} cb A callback `Function` which is given the argument `err` - for errors that may have occured
   */
  put (key, value, cb) {
    key = ethUtil.toBuffer(key)
    value = ethUtil.toBuffer(value)

    if (!value || value.toString() === '') {
      // 进行删除操作
      this.del(key, cb)
    } else {
      cb = callTogether(cb, this.sem.leave)

      this.sem.take(() => {
        if (this.root.toString('hex') !== ethUtil.SHA3_RLP.toString('hex')) {
          // first try to find the give key or its nearst node
          this.findPath(key, (err, foundValue, keyRemainder, stack) => {
            if (err) {
              return cb(err)
            }
            // then update
            this._updateNode(key, value, keyRemainder, stack, cb)
          })
        } else {
          this._createInitialNode(key, value, cb) // if no root initialize this trie
        }
      })
    }
  }

  /**
   * deletes a value given a `key`
   * @method del
   * @memberof Trie
   * @param {Buffer|String} key
   * @param {Function} callback the callback `Function`
   */
  del (key, cb) {
    key = ethUtil.toBuffer(key)
    cb = callTogether(cb, this.sem.leave)

    this.sem.take(() => {
      this.findPath(key, (err, foundValue, keyRemainder, stack) => {
        if (err) {
          return cb(err)
        }
        if (foundValue) {
          this._deleteNode(key, stack, cb)
        } else {
          cb()
        }
      })
    })
  }

  // retrieves a node from dbs by hash
  _lookupNode (node, cb) {
    if (TrieNode.isRawNode(node)) {
      // 指定了TrieNode的元数据，返回TrieNode对象
      cb(null, new TrieNode(node))
    } else {
      // 从数据库中寻找指定root的节点
      this.db.get(node, (err, value) => {
        if (err) {
          throw err
        }

        if (value) {
          value = new TrieNode(rlp.decode(value))
        } else {
          err = new Error('Missing node in DB')
        }

        cb(err, value)
      })
    }
  }

  // writes a single node to dbs
  _putNode (node, cb) {
    const hash = node.hash()
    const serialized = node.serialize()
    this.db.put(hash, serialized, cb)
  }

  /**
   * Tries to find a path to the node for the given key
   * It returns a `stack` of nodes to the closet node
   * @method findPath
   * @memberof Trie
   * @param {String|Buffer} - key - the search key
   * @param {Function} - cb - the callback function. Its is given the following
   * arguments
   *  - err - any errors encontered
   *  - node - the last node found
   *  - keyRemainder - the remaining key nibbles not accounted for
   *  - stack - an array of nodes that forms the path to node we are searching for
   */
  findPath (targetKey, cb) {
    const stack = []
    targetKey = stringToNibbles(targetKey)

    this._walkTrie(this.root, processNode, cb)

    /**
     * @param {} nodeRef 节点对应的哈希
     * @param {} node 节点
     * @param {} keyProgress 节点对应的完整的key
     * @param {} walkController
     */
    function processNode (nodeRef, node, keyProgress, walkController) {
      const nodeKey = node.key || []
      // 获取还需要匹配的key
      const keyRemainder = targetKey.slice(matchingNibbleLength(keyProgress, targetKey))
      // 判断还需要匹配的key是否和当前node的key相同
      const matchingLen = matchingNibbleLength(keyRemainder, nodeKey)

      stack.push(node)

      if (node.type === 'branch') {
        if (keyRemainder.length === 0) {
          walkController.return(null, node, [], stack)
        // we exhausted the key without finding a node
        } else {
          // 获取分支节点中具体的槽位
          const branchIndex = keyRemainder[0]
          const branchNode = node.getValue(branchIndex)
          if (!branchNode) {
            // there are no more nodes to find and we didn't find the key
            walkController.return(null, null, keyRemainder, stack)
          } else {
            // node found, continuing search
            walkController.only(branchIndex)
          }
        }
      } else if (node.type === 'leaf') {
        if (doKeysMatch(keyRemainder, nodeKey)) {
          // keys match, return node with empty key
          walkController.return(null, node, [], stack)
        } else {
          // reached leaf but keys dont match
          walkController.return(null, null, keyRemainder, stack)
        }
      } else if (node.type === 'extention') {
        if (matchingLen !== nodeKey.length) {
          // keys dont match, fail
          walkController.return(null, null, keyRemainder, stack)
        } else {
          // keys match, continue search
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
   * Finds all nodes that store k,v values，遍历MPT树
   */
  _findValueNodes (onFound, cb) {
    this._walkTrie(this.root, (nodeRef, node, key, walkController) => {
      let fullKey = key

      if (node.key) {
        fullKey = key.concat(node.key)
      }

      if (node.type === 'leaf') {
        // found leaf node!
        onFound(nodeRef, node, fullKey, walkController.next)
      } else if (node.type === 'branch' && node.value) {
        // found branch with value
        onFound(nodeRef, node, fullKey, walkController.next)
      } else {
        // keep looking for value nodes
        walkController.next()
      }
    }, cb)
  }

  /*
   * Finds all nodes that are stored directly in the db
   * (some nodes are stored raw inside other nodes)
   */
  _findDbNodes (onFound, cb) {
    this._walkTrie(this.root, (nodeRef, node, key, walkController) => {
      if (TrieNode.isRawNode(nodeRef)) {
        walkController.next()
      } else {
        onFound(nodeRef, node, key, walkController.next)
      }
    }, cb)
  }

  /**
   * Updates a node
   * @method _updateNode
   * @private
   * @param {Buffer} key
   * @param {Buffer| String} value
   * @param {Array} keyRemainder 剩余的没有匹配的key
   * @param {Array} stack - 遍历到的node
   * @param {Function} cb - the callback 
   */
  _updateNode (key, value, keyRemainder, stack, cb) {
    // 新加入的节点
    const toSave = []
    const lastNode = stack.pop()

    // add the new nodes
    key = stringToNibbles(key)

    // Check if the last node is a leaf and the key matches to this
    let matchLeaf = false

    // 第一种情况，最后一个节点时叶子节点
    if (lastNode.type === 'leaf') {

      // 统计键的长度
      let l = 0
      for (let i = 0; i < stack.length; i++) {
        const n = stack[i]

        if (n.type === 'branch') {
          l++
        } else {
          l += n.key.length
        }
      }

      // 新插入的节点和最后一个节点的key值完全匹配（注意，keyRemainder的长度为0对应两种情况，一是value存储在分支节点中，二是value存储在键值对节点（叶子节点））
      if ((matchingNibbleLength(lastNode.key, key.slice(l)) === lastNode.key.length) && (keyRemainder.length === 0)) {
        matchLeaf = true
      }
    }

    if (matchLeaf) {
      // 新插入的节点与最后一个节点的key值完全匹配，只需要更新最后一个节点的value
      lastNode.value = value
      stack.push(lastNode)
    } else if (lastNode.type === 'branch') {
      stack.push(lastNode)
      if (keyRemainder.length !== 0) {
        // 最后一个节点是分支节点，但是新插入的节点无法在分支节点中存储，这时候需要创建一个键值对节点（叶子节点），用来存储新加入的节点
        keyRemainder.shift()
        // create a new leaf
        const newLeaf = new TrieNode('leaf', keyRemainder, value)
        stack.push(newLeaf)
      } else {
        // 最后一个节点是分支节点，并且新插入的节点可以存储在分支节点中，这时候只需要更新分支节点的值
        lastNode.value = value
      }
    } else {
      // 最后一个节点是键值对节点（叶子节点或者扩展节点），并且叶子节点的key值与新加入的节点的key值不匹配，这时候需要创建一个分支节点，用来间接或者直接存储最后一个节点和新加入的节点
      const lastKey = lastNode.key
      const matchingLength = matchingNibbleLength(lastKey, keyRemainder)
      const newBranchNode = new TrieNode('branch')

      // 最后一个节点和新加入的节点的key值有部分匹配，更改最后一个节点的key值和value值
      if (matchingLength !== 0) {
        // 获取部分匹配的key值
        const newKey = lastNode.key.slice(0, matchingLength)
        // 通过部分匹配的key值创建一个键值对节点（扩展节点）（注意这里的value没有任何意义，因为这个value会在后续的处理中被重新计算）
        const newExtNode = new TrieNode('extention', newKey, value)
        // 插入键值对节点（扩展节点）
        stack.push(newExtNode)
        // 重新设置最后一个节点的key
        lastKey.splice(0, matchingLength)
        // 重新设置新加入的节点的key
        keyRemainder.splice(0, matchingLength)
      }

      // 插入一个分支节点，用来连接新加入的节点和原先的最后一个节点
      stack.push(newBranchNode)

      // 最后一个节点的key值和新加入的节点的key值，有重叠部分，但是新加入节点的key不包含最后一个节点的key
      if (lastKey.length !== 0) {
        // 获取最后一个节点对应分支节点的槽位
        const branchKey = lastKey.shift()

        if (lastNode.type === 'leaf') {
          // 最后一个节点是叶子节点，记录叶子节点对应的值
          lastNode.key = lastKey
          // 获取lastNode的元数据
          const formatedNode = this._formatNode(lastNode, false, toSave)
          // 这里的formatedNode应当是一个叶子节点
          newBranchNode.setValue(branchKey, formatedNode)
        } else {
          // 最后一个节点是扩展节点，获取lastNode的元数据，里面包含lastNode的key值，以及对应的value
          this._formatNode(lastNode, false, true, toSave)
          // 这里的lastNode.value应当是一个扩展节点，扩展节点下面连接着一个分支节点
          newBranchNode.setValue(branchKey, lastNode.value)
        }
      } else {
        // 新加入节点的key包含最后一个节点的key（注意，这种情况下，最后一个节点肯定是叶子节点，因为如果是扩展节点，新加入的节点必定走分支节点，这与上面的假设矛盾）
        newBranchNode.value = lastNode.value
      }

      // 最后一个节点的key值和新加入的节点的key值，有重叠部分，但是最后一个节点的key不包含新加入节点的key
      if (keyRemainder.length !== 0) {
        keyRemainder.shift()
        // 创建一个叶子节点
        const newLeafNode = new TrieNode('leaf', keyRemainder, value)
        stack.push(newLeafNode)
      } else {
        // 最后一个节点的key包含新加入节点的key，新加入的节点的值放入
        newBranchNode.value = value
      }
    }

    // 保存修改过的节点
    this._saveStack(key, stack, toSave, cb)
  }

  _walkTrie (root, onNode, onDone) {
    const self = this
    root = root || this.root
    onDone = onDone || function () {}
    let aborted = false
    let returnValues = []

    // 判断root是否为空
    if (root.toString('hex') === ethUtil.SHA3_RLP.toString('hex')) {
      return onDone()
    }

    // 从数据中寻找root对应的节点
    this._lookupNode(root, (e, node) => {
      if (e) {
        return onDone(e, node)
      }
      processNode(root, node, null, err => {
        if (err) {
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
     * @param {} node 对应的节点
     * @param {} key 节点对应的完整的key
     * @param {} cb
     */
    function processNode (nodeRef, node, key, cb) {
      if (!node || aborted) {
        return cb()
      }

      let stopped = false
      key = key || []

      const walkController = {
        stop: function () {
          stopped = true
          cb()
        },
        // end all traversal and return values to the onDone cb
        return: function () {
          aborted = true
          returnValues = arguments
          cb()
        },
        // 遍历路线
        next: function () {
          if (aborted || stopped) {
            return cb()
          }

          // 获取子节点（如果node为叶子节点，则返回空数组，如果是扩展节点，返回键值对，如果是分支节点）
          const children = node.getChildren()
          async.forEachOf(children, (childData, index, cb) => {
            // 获取key
            const keyExtension = childData[0]
            // 获取value
            const childRef = childData[1]
            // 获取完整的key
            const childKey = key.concat(keyExtension)
            const priority = childKey.length
            // 优先遍历已经遍历到较深层次的节点
            taskExecutor.execute(priority, taskCallback => {
              self._lookupNode(childRef, (e, childNode) => {
                if (e) {
                  return cb(e, node)
                }
                taskCallback()
                processNode(childRef, childNode, childKey, cb)
              })
            })
          }, cb)
        },
        // 走指定的路线
        only: function (childIndex) {
          // 获取扩展节点信息
          const childRef = node.getValue(childIndex)
          // 扩展节点对应的键
          const childKey = key.slice()
          childKey.push(childIndex)
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
   * saves a stack
   * @method _saveStack
   * @private
   * @param {Array} key - the key. Should follow the stack
   * @param {Array} stack - a stack of nodes to the value given by the key
   * @param {Array} opStack - a stack of levelup operations to commit at the end of this funciton
   * @param {Function} cb
   */
  _saveStack (key, stack, opStack, cb) {
    let lastRoot

    // update nodes
    while (stack.length) {
      const node = stack.pop()
      if (node.type === 'leaf') {
        key.splice(key.length - node.key.length)
      } else if (node.type === 'extention') {
        key.splice(key.length - node.key.length)
        if (lastRoot) {
          node.value = lastRoot
        }
      } else if (node.type === 'branch') {
        if (lastRoot) {
          const branchKey = key.pop()
          node.setValue(branchKey, lastRoot)
        }
      }
      lastRoot = this._formatNode(node, stack.length === 0, opStack)
    }

    if (lastRoot) {
      this.root = lastRoot
    }

    this.db.batch(opStack, cb)
  }

  _deleteNode (key, stack, cb) {
    function processBranchNode (key, branchKey, branchNode, parentNode, stack) {
      // branchNode is the node ON the branch node not THE branch node
      const branchNodeKey = branchNode.key
      if (!parentNode || parentNode.type === 'branch') {
        // branch->?
        if (parentNode) {
          stack.push(parentNode)
        }

        if (branchNode.type === 'branch') {
          // create an extention node
          // branch->extention->branch
          const extentionNode = new TrieNode('extention', [branchKey], null)
          stack.push(extentionNode)
          key.push(branchKey)
        } else {
          // branch key is an extention or a leaf
          // branch->(leaf or extention)
          branchNodeKey.unshift(branchKey)
          branchNode.key = branchNodeKey

          // hackery. This is equvilant to array.concat except we need keep the
          // rerfance to the `key` that was passed in.
          branchNodeKey.unshift(0)
          branchNodeKey.unshift(key.length)
          key.splice.apply(key, branchNodeKey)
        }
        stack.push(branchNode)
      } else {
        // parent is a extention
        let parentKey = parentNode.key

        if (branchNode.type === 'branch') {
          // ext->branch
          parentKey.push(branchKey)
          key.push(branchKey)
          parentNode.key = parentKey
          stack.push(parentNode)
        } else {
          // branch node is an leaf or extention and parent node is an exstention
          // add two keys together
          // dont push the parent node
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

    if (!Array.isArray(key)) {
      // convert key to nibbles
      key = stringToNibbles(key)
    }

    if (!parentNode) {
      // the root here has to be a leaf.
      this.root = this.EMPTY_TRIE_ROOT
      cb()
    } else {
      if (lastNode.type === 'branch') {
        lastNode.value = null
      } else {
        // the lastNode has to be a leaf if its not a branch. And a leaf's parent
        // if it has one must be a branch.
        const lastNodeKey = lastNode.key
        key.splice(key.length - lastNodeKey.length)
        // delete the value
        this._formatNode(lastNode, false, true, opStack)
        parentNode.setValue(key.pop(), null)
        lastNode = parentNode
        parentNode = stack.pop()
      }

      // nodes on the branch
      const branchNodes = []
      // count the number of nodes on the branch
      lastNode.raw.forEach((node, i) => {
        const val = lastNode.getValue(i)

        if (val) {
          branchNodes.push([i, val])
        }
      })

      // if there is only one branch node left, collapse the branch node
      if (branchNodes.length === 1) {
        // add the one remaing branch node to node above it
        const branchNode = branchNodes[0][1]
        const branchNodeKey = branchNodes[0][0]

        // look up node
        this._lookupNode(branchNode, (e, foundNode) => {
          if (e) {
            return cb(e, foundNode)
          }
          key = processBranchNode(key, branchNodeKey, foundNode, parentNode, stack, opStack)
          this._saveStack(key, stack, opStack, cb)
        })
      } else {
        // simple removing a leaf and recaluclation the stack
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

    if (rlpNode.length >= 32 || topLevel) {
      const hashRoot = node.hash()

      if (remove && this.isCheckpoint) {
        opStack.push({
          type: 'del',
          key: hashRoot
        })
      } else {
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
