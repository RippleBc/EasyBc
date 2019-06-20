/**
 * Prepends hex prefix to an array of nibbles，键数据的编码算法
 * @method addHexPrefix
 * @param {Array} Array of nibbles
 * @returns {Array} - returns buffer of encoded data
 **/
export function addHexPrefix (key, terminator) {
  if (key.length % 2) {
    // key的长度是否是奇数，向key的头部增加一个值为1的半字节
    key.unshift(1)
  } else {
    // key的长度是否是偶数，向key的头部增加两个值为0的半字节
    key.unshift(0)
    key.unshift(0)
  }

  if (terminator) {
    // 带有结束标记，key的第一个半字节加2（结果是2或者3），所以可以通过半字节数组的首个成员的大小推断节点类型（0和1的value存储哈西字符串，2和3的value存储实际内容）
    key[0] += 2
  }

  return key
}

/**
 * Removes hex prefix of an array of nibbles.
 * @method removeHexPrefix
 * @param {Array} Array of nibbles
 * @private
 */
export function removeHexPrefix (val) {
  if (val[0] % 2) {
    val = val.slice(1)
  } else {
    val = val.slice(2)
  }

  return val
}

/**
 * Returns true if hexprefixed path is for a terminating (leaf) node.
 * @method isTerminator
 * @param {Array} key - an hexprefixed array of nibbles
 * @private
 */
export function isTerminator (key) {
  // 只有键拥有结束标记的情况下，nibbleArray key的首个半字节才会大于0（2或者3）
  return key[0] > 1
}
