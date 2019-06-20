const assert = require("assert")

/**
 * @param {Buffer} key
 * @return {Array}
 */
module.exports.bufferToNibbles = function(key) 
{
  assert(Buffer.isBuffer(key), `bufferToNibbles, key should be an Buffer, now is ${typeof key}`)

  let nibbles = []

  for(let i = 0; i < key.length; i++)
  {
    let q = i * 2;
    nibbles[q] = key[i] >> 4
    nibbles[++q] = key[i] % 16
  }

  return nibbles
}

/**
 * @param {Array} key
 */
module.exports.nibblesToBuffer = function(key)
{
  assert(Array.isArray(key), `nibblesToBuffer, key should be an Array, now is ${typeof key}`)

  let buf = Buffer.alloc(key.length / 2)
  for(let i = 0; i < buf.length; i++) 
  {
    let q = i * 2
    buf[i] = (key[q] << 4) + key[++q]
  }
  return buf
}

/**
 * nibB中和nibA匹配的字符的个数
 * @param {Array} nibA
 * @param {Array} nibB
 */
module.exports.matchingNibbleLength = function(nibA, nibB) 
{
  assert(Array.isArray(nibA), `matchingNibbleLength, nibA should be an Array, now is ${typeof nibA}`)
  assert(Array.isArray(nibB), `matchingNibbleLength, nibB should be an Array, now is ${typeof nibB}`)

  let i = 0
  while(nibA[i] === nibB[i] && nibA.length > i) 
  {
    i++
  }
  return i
}

/**
 * Compare two nibble array keys.
 * @param {Array} keyA
 * @param {Array} keyB
 */
module.exports.doKeysMatch = function(keyA, keyB) 
{
  assert(Array.isArray(keyA), `doKeysMatch, keyA should be an Array, now is ${typeof keyA}`)
  assert(Array.isArray(keyB), `doKeysMatch, keyB should be an Array, now is ${typeof keyB}`)

  const length = matchingNibbleLength(keyA, keyB)
  return length === keyA.length && length === keyB.length
}
