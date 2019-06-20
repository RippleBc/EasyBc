const assert = require("assert")

/**
 * @param {Array} key - Array of nibbles
 * @param {Boolean} terminator
 * @returns {Array}
 **/
module.exports.addHexPrefix = function(key, terminator = false) 
{
  assert(Array.isArray(key), `addHexPrefix, key should be an Array, now is ${typeof key}`)
  assert(typeof terminator === 'boolean', `addHexPrefix, terminator should be an Boolean, now is ${typeof terminator}`)

  if (key.length % 2)
  { 
    // key的长度是否是奇数，向key的头部增加一个值为1的半字节
    key.unshift(1)
  } 
  else 
  {
    // key的长度是否是偶数，向key的头部增加两个值为0的半字节
    key.unshift(0)
    key.unshift(0)
  }

  if(terminator) {
    key[0] += 2
  }

  return key
}

/**
 * @param {Array} key
 */
module.exports.removeHexPrefix = function(key) 
{
  assert(Array.isArray(key), `removeHexPrefix, key should be an Array, now is ${typeof key}`)

  if(key[0] % 2) 
  {
    key = key.slice(1)
  } 
  else 
  {
    key = key.slice(2)
  }

  return key
}

/**
 * Returns true if hexprefixed path is for a terminating (leaf) node.
 * @method isTerminator
 * @param {Array} key - an hexprefixed array of nibbles
 * @private
 */
module.exports.isTerminator = function(key)
{
  assert(Array.isArray(key), `isTerminator, key should be an Array, now is ${typeof key}`)

  // 只有键拥有结束标记的情况下，nibbleArray key的首个半字节才会大于1（2或者3）
  return key[0] > 1
}
