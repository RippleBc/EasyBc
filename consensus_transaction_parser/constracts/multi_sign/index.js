const assert = require("assert");
const utils = require("../../../depends/utils");
const multiSignConstractId = require("../../../consensus_constracts/multiSignConstract").id;
const { saveMultiSignPayRequest, saveMultiSignPay } = require("./db");

const Buffer = utils.Buffer;

/**
 * @param {Buffer} id
 * @param {Buffer} name
 * @param {Array} dataArray
 */
const parse = async function (id, name, dataArray)
{
  assert(Buffer.isBuffer(id), `MultiSign parse, id should be an Buffer, now is ${typeof id}`);
  assert(Buffer.isBuffer(name), `MultiSign parse, name should be an Buffer, now is ${typeof name}`);
  assert(Array.isArray(dataArray), `MultiSign parse, dataArray should be an Array, now is ${typeof dataArray}`);

  if (id.toString('hex') !== multiSignConstractId) {
    return;
  }
  
  if (name.toString() === 'MultiSignPayRequestEvent') {
    await saveMultiSignPayRequest(...dataArray);
  }
  else if (name.toString() === 'MultiSignPayEvent') {
    await saveMultiSignPay(...dataArray);
  }
}

module.exports = parse;