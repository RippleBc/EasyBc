
const assert = require("assert");
const utils = require("../../depends/utils");

const Buffer = utils.Buffer;

const broadCastSpv = require("./broadCastSpv");

/**
 * @param {Buffer} blockNumber
 * @param {Array} transactions
 */
module.exports = async (blockNumber, transactions) => {
  assert(Buffer.isBuffer(blockNumber), `broadCastSpv, blockNumber should be an Buffer, now is ${typeof blockNumber}`)
  assert(Array.isArray(transactions), `broadCastSpv, transactions should be an Array, now is ${typeof transactions}`)


  broadCastSpv(blockNumber, transactions);
}
