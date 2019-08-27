const assert = require("assert");
const utils = require("../../depends/utils");
const { saveTransactions } = require("./db")

const Buffer = utils.Buffer;

/**
 * @param {Buffer} blockNumber 
 * @param {Array} transactions 
 */
const parse = async function (blockNumber, transactions)
{
  assert(Buffer.isBuffer(blockNumber), `Transaction parse, blockNumber should be an Buffer, now is ${typeof blockNumber}`);
  assert(Array.isArray(transactions), `Transaction parse, transactions should be an Array, now is ${typeof transactions}`);

  await saveTransactions(blockNumber, transactions)
}

module.exports = parse;

