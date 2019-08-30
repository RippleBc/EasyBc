const assert = require("assert");
const utils = require("../../../depends/utils");
const sideChainConstractId = require("../../../consensus_constracts/sideChainConstract").id
const { saveCrossPayRequest, saveCrossPay, saveSideChainAppendGuarantee } = require("./db");

const Buffer = utils.Buffer;

/**
 * @param {Buffer} id
 * @param {Buffer} name
 * @param {Array} dataArray
 */
const parse = async function (id, name, dataArray) {
  assert(Buffer.isBuffer(id), `SideChain parse, id should be an Buffer, now is ${typeof id}`);
  assert(Buffer.isBuffer(name), `SideChain parse, name should be an Buffer, now is ${typeof name}`);
  assert(Array.isArray(dataArray), `SideChain parse, dataArray should be an Array, now is ${typeof dataArray}`);

  if (id.toString('hex') !== sideChainConstractId) {
    return;
  }

  if (name.toString() === 'CorssPayRequestEvent') {
    await saveCrossPayRequest(...dataArray);
  }
  else if (name.toString() === 'CorssPayEvent') {
    await saveCrossPay(...dataArray);
  }
  else if (name.toString() === 'AppendGuaranteeEvent')
  {
    await saveSideChainAppendGuarantee(...dataArray)
  }
}

module.exports = parse;