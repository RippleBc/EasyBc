const assert = require("assert");
const utils = require("../../../depends/utils");

const Buffer = utils.Buffer;

const mysql = process[Symbol.for("mysql")];

const log4js = require("../../logConfig");
const logger = log4js.getLogger();

/**
 * @param {Buffer} code
 * @param {Buffer} timestamp
 * @param {Buffer} txHash
 * @param {Buffer} number
 * @param {Buffer} to
 * @param {Buffer} value
 * @param {Buffer} sponsor
 */
const saveCrossPayRequest = async function(code, timestamp, txHash, number, to, value, sponsor)
{
  assert(Buffer.isBuffer(code), `SideChain saveCrossPayRequest, code should be an Buffer, now is ${typeof code}`);
  assert(Buffer.isBuffer(timestamp), `SideChain saveCrossPayRequest, timestamp should be an Buffer, now is ${typeof timestamp}`);
  assert(Buffer.isBuffer(txHash), `SideChain saveCrossPayRequest, txHash should be an Buffer, now is ${typeof txHash}`);
  assert(Buffer.isBuffer(number), `SideChain saveCrossPayRequest, number should be an Buffer, now is ${typeof number}`);
  assert(Buffer.isBuffer(to), `SideChain saveCrossPayRequest, to should be an Buffer, now is ${typeof to}`);
  assert(Buffer.isBuffer(value), `SideChain saveCrossPayRequest, value should be an Buffer, now is ${typeof value}`);
  assert(Buffer.isBuffer(sponsor), `SideChain saveCrossPayRequest, sponsor should be an Buffer, now is ${typeof sponsor}`);

  try {
    await mysql.CrossPayRequest.create({
      code: code.toString('hex'),
      timestamp: timestamp.toString('hex'),
      txHash: txHash.toString('hex'),
      number: number.toString('hex'),
      to: to.toString('hex'),
      value: value.toString('hex'),
      sponsor: sponsor.toString('hex')
    });
  } catch (e) {
    logger.error(`SideChain saveCrossPayRequest, throw exception, ${e}`)
  }
}

/**
 * @param {Buffer} code
 * @param {Buffer} timestamp
 * @param {Buffer} txHash
 * @param {Buffer} to
 * @param {Buffer} value
 */
const saveCrossPay = async function(code, timestamp, txHash, to, value)
{
  assert(Buffer.isBuffer(code), `SideChain saveCrossPay, code should be an Buffer, now is ${typeof code}`);
  assert(Buffer.isBuffer(timestamp), `SideChain saveCrossPay, timestamp should be an Buffer, now is ${typeof timestamp}`);
  assert(Buffer.isBuffer(txHash), `SideChain saveCrossPay, txHash should be an Buffer, now is ${typeof txHash}`);
  assert(Buffer.isBuffer(to), `SideChain saveCrossPay, to should be an Buffer, now is ${typeof to}`);
  assert(Buffer.isBuffer(value), `SideChain saveCrossPay, value should be an Buffer, now is ${typeof value}`);

  try {
    await mysql.CrossPay.create({
      code: code.toString('hex'),
      timestamp: timestamp.toString('hex'),
      txHash: txHash.toString('hex'),
      to: to.toString('hex'),
      value: value.toString('hex'),
    });
  }
  catch (e) {
    logger.error(`SideChain saveCrossPay, throw exception, ${e}`)
  }
}

/**
 * @param {Buffer} code
 * @param {Buffer} txHash
 */
const saveSideChainAppendGuarantee = async function (code, txHash)
{
  try {
    await mysql.SideChainAppendGuarantee.create({
      code: code.toString('hex'),
      txHash: txHash.toString('hex')
    })
  }
  catch (e) {
    logger.error(`SideChain saveSideChainAppendGuarantee, throw exception, ${e}`)
  }
}

module.exports = {
  saveCrossPayRequest,
  saveCrossPay,
  saveSideChainAppendGuarantee
}