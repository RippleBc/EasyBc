const utils = require("../../depends/utils");
const assert = require("assert");
const { Op } = require('sequelize');

const Buffer = utils.Buffer;

const mysql = process[Symbol.for("mysql")];

const WAITING_CROSS_PAY_FLUSH_COUNT_LIMIT = 50;
const WAITING_CROSS_PAY_FLUSH_SECONDS_INTERVAL_THRESHOLD = 5;
var waitingCrossPayLastFlushTime = 0;

/**
   * @param {Number} offset
   * @param {Number} limit
   * @param {String} code
   * @param {String} timestamp
   * @param {String} txHash
   * @param {String} number
   * @param {String} to
   * @param {String} value
   * @param {String} sponsor
   * @param {Number} beginTime
   * @param {Number} endTime
   */
const getCrossPayRequest = async function({ offset, limit, code, timestamp, txHash, number, to, value, sponsor, beginTime, endTime }) {
  assert(typeof offset === 'number', `CrossChain getCrossPayRequest, offset should be an Number, now is ${typeof offset}`);
  assert(typeof limit === 'number', `CrossChain getCrossPayRequest, limit should be an Number, now is ${typeof limit}`);

  if (beginTime !== undefined) {
    assert(typeof beginTime === 'number', `CrossChain getCrossPayRequest, beginTime should be an Number, now is ${typeof beginTime}`);
  }
  if (endTime !== undefined) {
    assert(typeof endTime === 'number', `CrossChain getCrossPayRequest, endTime should be an Number, now is ${typeof endTime}`);
  }

  const now = new Date()
  const where = {
    createdAt: {
      [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
      [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
    }
  };

  if (code) {
    assert(typeof code === 'string', `CrossChain getCrossPayRequest, code should be an String, now is ${typeof code}`);
    where.code = code;
  }
  if (timestamp !== undefined) {
    assert(typeof timestamp === 'number', `CrossChain getCrossPayRequest, timestamp should be an Number, now is ${typeof timestamp}`);
    where.timestamp = timestamp;
  }
  if (txHash) {
    assert(typeof txHash === 'string', `CrossChain getCrossPayRequest, txHash should be an String, now is ${typeof txHash}`);
    where.txHash = txHash;
  }
  if (number) {
    assert(typeof number === 'string', `CrossChain getCrossPayRequest, number should be an String, now is ${typeof number}`);
    where.number = number;
  }
  if (to) {
    assert(typeof to === 'string', `CrossChain getCrossPayRequest, to should be an String, now is ${typeof to}`);
    where.to = to;
  }
  if (value) {
    assert(typeof value === 'string', `CrossChain getCrossPayRequest, value should be an String, now is ${typeof value}`);
    where.value = value;
  }
  if (sponsor) {
    assert(typeof sponsor === 'string', `CrossChain getCrossPayRequest, sponsor should be an String, now is ${typeof sponsor}`);
    where.sponsor = sponsor;
  }

  return await mysql.CrossPayRequest.findAndCountAll({
    where: where,
    order: [['id', 'DESC']],
    offset: offset,
    limit: limit
  });
}

/**
 * @param {Number} offset
 * @param {Number} limit
 * @param {String} code
 * @param {String} timestamp
 * @param {String} txHash
 * @param {String} to
 * @param {String} value
 * @param {Number} beginTime
 * @param {Number} endTime
 */
const getCrossPay = async function({ offset, limit, code, timestamp, txHash, to, value, beginTime, endTime }) {
  assert(typeof offset === 'number', `CrossChain getCrossPay, offset should be an Number, now is ${typeof offset}`);
  assert(typeof limit === 'number', `CrossChain getCrossPay, limit should be an Number, now is ${typeof limit}`);

  if (beginTime !== undefined) {
    assert(typeof beginTime === 'number', `CrossChain getCrossPay, beginTime should be an Number, now is ${typeof beginTime}`);
  }
  if (endTime !== undefined) {
    assert(typeof endTime === 'number', `CrossChain getCrossPay, endTime should be an Number, now is ${typeof endTime}`);
  }

  const now = new Date()
  const where = {
    createdAt: {
      [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
      [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
    }
  };

  if (code) {
    assert(typeof code === 'string', `CrossChain getCrossPay, code should be an String, now is ${typeof code}`);
    where.code = code;
  }
  if (timestamp) {
    assert(typeof timestamp === 'string', `CrossChain getCrossPay, timestamp should be an String, now is ${typeof timestamp}`);
    where.timestamp = timestamp;
  }
  if (txHash) {
    assert(typeof txHash === 'string', `CrossChain getCrossPay, txHash should be an String, now is ${typeof txHash}`);
    where.txHash = txHash;
  }
  if (to) {
    assert(typeof to === 'string', `CrossChain getCrossPay, to should be an String, now is ${typeof to}`);
    where.to = to;
  }
  if (value) {
    assert(typeof value === 'string', `CrossChain getCrossPay, value should be an String, now is ${typeof value}`);
    where.value = value;
  }

  return await mysql.CrossPay.findAndCountAll({
    where: where,
    order: [['id', 'DESC']],
    offset: offset,
    limit: limit
  });
}

/**
   * @param {Buffer} code
   */
const getSideChain = async function(code) {
  assert(typeof code === 'string', `CrossChain getSideChain, code should be a String, now is ${typeof code}`);

  return await mysql.SideChain.findAndCountAll({
    attributes: ['url'],
    where: {
      code: code.toString("hex")
    }
  });
}
/**
 * @param {String} code
 * @param {String} url
 */
const saveSideChain = async function(code, url)
{
  assert(typeof code === 'string', `CrossChain saveSideChain, code should be a String, now is ${typeof code}`);
  assert(typeof url === 'string', `CrossChain saveSideChain, code should be a String, now is ${typeof code}`);

  await mysql.SideChain.create({
    code: code,
    url: url
  })
}

/**
 * @param {String} hash
 * @param {String} number
 * @param {String} chainCode
 * @return {Array} [receivedSpv, created]
 */
const saveReceivedSpv = async function(hash, number, chainCode) {
  assert(typeof hash === 'string', `CrossChain saveSpv, hash should be a String, now is ${typeof hash}`);
  assert(typeof number === 'string', `CrossChain saveSpv, number should be a String, now is ${typeof number}`);
  assert(typeof chainCode === 'string', `CrossChain saveSpv, chainCode should be a String, now is ${typeof chainCode}`);

  return await mysql.ReceivedSpv.findOrCreate({
    where: {
      hash: hash,
      number: number,
      chainCode: chainCode
    },
    defaults: {

    }
  });
}

/**
 * @param {String} chainCode
 * @return {Buffer} address
 */
const getSideChainConstract = async function(chainCode)
{
  assert(typeof chainCode === 'string', `CrossChain getSideChainConstract, chainCode should be a String, now is ${typeof chainCode}`);

  const sideChainConstract = await mysql.SideChainConstract.findOne({
    attributes: ['address'],
    where: {
      chainCode: chainCode
    }
  });

  return sideChainConstract.address;
}

/**
 * @param {String} hash
 * @param {String} number
 * @param {String} chainCode
 * @param {String} to
 * @param {String} value
 * @return {Array} [receivedSpv, created]
 */
const saveWaitingCrossPay = async function(hash, number, chainCode, to, value) {
  assert(typeof hash === 'string', `CrossChain saveWaitingCrossPay, hash should be a String, now is ${typeof hash}`);
  assert(typeof number === 'string', `CrossChain saveWaitingCrossPay, number should be a String, now is ${typeof number}`);
  assert(typeof chainCode === 'string', `CrossChain saveWaitingCrossPay, chainCode should be a String, now is ${typeof chainCode}`);
  assert(typeof to === 'string', `CrossChain saveWaitingCrossPay, to should be a String, now is ${typeof to}`);
  assert(typeof value === 'string', `CrossChain saveWaitingCrossPay, value should be a String, now is ${typeof value}`);

  return await mysql.WaitingCrossPay.findOrCreate({
    where: {
      hash: hash,
      number: number,
      chainCode: chainCode
    },
    defaults: {
      to: to,
      value: value
    }
  });
}

const getWaitingCrossPay = async function() {
  // check interval
  const now = Date.now();
  if (now - waitingCrossPayLastFlushTime < WAITING_CROSS_PAY_FLUSH_SECONDS_INTERVAL_THRESHOLD * 1000) {
    return [];
  }
  waitingCrossPayLastFlushTime = now;

  // fetch data
  const rows = await mysql.WaitingCrossPay.findAll({
    limit: WAITING_CROSS_PAY_FLUSH_COUNT_LIMIT,
    order: [['id', 'ASC']]
  });

  return rows;
}

module.exports ={
  getCrossPayRequest,
  getCrossPay,
  getSideChain,
  saveSideChain,
  saveReceivedSpv,
  getSideChainConstract,
  saveWaitingCrossPay,
  getWaitingCrossPay,
}