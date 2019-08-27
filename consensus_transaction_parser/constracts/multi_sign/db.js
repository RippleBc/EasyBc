const assert = require("assert");
const utils = require("../../../depends/utils");

const Buffer = utils.Buffer;

const mysql = process[Symbol.for("mysql")];

const log4js = require("../../logConfig");
const logger = log4js.getLogger();

/**
 * @param {Buffer} address
 * @param {Buffer} txHash
 * @param {Buffer} action
 * @param {Buffer} timestamp
 * @param {Buffer} to
 * @param {Buffer} value
 * @param {Buffer} sponsor
 */
const saveMultiSignPayRequest = async function(address, txHash, action, timestamp, to, value, sponsor)
{
  assert(Buffer.isBuffer(address), `MultiSign saveMultiSignPayRequest, address should be an Buffer, now is ${typeof address}`);
  assert(Buffer.isBuffer(txHash), `MultiSign saveMultiSignPayRequest, txHash should be an Buffer, now is ${typeof txHash}`);
  assert(Buffer.isBuffer(action), `MultiSign saveMultiSignPayRequest, action should be an Buffer, now is ${typeof action}`);
  assert(Buffer.isBuffer(timestamp), `MultiSign saveMultiSignPayRequest, timestamp should be an Buffer, now is ${typeof timestamp}`);
  assert(Buffer.isBuffer(to), `MultiSign saveMultiSignPayRequest, to should be an Buffer, now is ${typeof to}`);
  assert(Buffer.isBuffer(value), `MultiSign saveMultiSignPayRequest, value should be an Buffer, now is ${typeof value}`);
  assert(Buffer.isBuffer(sponsor), `MultiSign saveMultiSignPayRequest, sponsor should be an Buffer, now is ${typeof sponsor}`);

  try {
    await mysql.MultiSignPayRequest.create({
      address: address.toString('hex'),
      txHash: txHash.toString('hex'),
      action: action.toString('hex'),
      timestamp: timestamp.toString('hex'),
      to: to.toString('hex'),
      value: value.toString('hex'),
      sponsor: sponsor.toString('hex')
    });
  }
  catch (e) {
    logger.error(`MultiSign saveMultiSignPayRequest, throw exception, ${e}`)
  }
}

/**
 * @param {Buffer} address
 * @param {Buffer} txHash
 * @param {Buffer} timestamp
 * @param {Buffer} to
 * @param {Buffer} value
 */
const saveMultiSignPay = async function(address, txHash, timestamp, to, value)
{
  assert(Buffer.isBuffer(address), `MultiSign saveMultiSignPay, address should be an Buffer, now is ${typeof address}`);
  assert(Buffer.isBuffer(txHash), `MultiSign saveMultiSignPay, txHash should be an Buffer, now is ${typeof txHash}`);
  assert(Buffer.isBuffer(timestamp), `MultiSign saveMultiSignPay, timestamp should be an Buffer, now is ${typeof timestamp}`);
  assert(Buffer.isBuffer(to), `MultiSign saveMultiSignPay, to should be an Buffer, now is ${typeof to}`);
  assert(Buffer.isBuffer(value), `MultiSign saveMultiSignPay, value should be an Buffer, now is ${typeof value}`);

  try {
    await mysql.MultiSignPay.create({
      address: address.toString('hex'),
      txHash: txHash.toString('hex'),
      timestamp: timestamp.toString('hex'),
      to: to.toString('hex'),
      value: value.toString('hex'),
    });
  }
  catch (e) {
    logger.error(`MultiSign saveMultiSignPay, throw exception, ${e}`)
  }
}

module.exports = {
  saveMultiSignPayRequest,
  saveMultiSignPay
}