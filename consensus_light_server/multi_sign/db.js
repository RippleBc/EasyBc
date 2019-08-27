const assert = require("assert");
const { Op } = require('sequelize');

const mysql = process[Symbol.for("mysql")];

/**
 * @param {Number} offset
 * @param {Number} limit
 * @param {String} address
 * @param {String} txHash
 * @param {String} action
 * @param {String} timestamp
 * @param {String} to
 * @param {String} value
 * @param {String} sponsor
 * @param {Number} beginTime
 * @param {Number} endTime
 */
const getMultiSignPayRequest = async function({ offset, limit, address, txHash, action, timestamp, to, value, sponsor, beginTime, endTime }) {
  assert(typeof offset === 'number', `MultiSign getMultiSignPayRequest, offset should be an Number, now is ${typeof offset}`);
  assert(typeof limit === 'number', `MultiSign getMultiSignPayRequest, limit should be an Number, now is ${typeof limit}`);

  if (beginTime !== undefined) {
    assert(typeof beginTime === 'number', `MultiSign getMultiSignPayRequest, beginTime should be an Number, now is ${typeof beginTime}`);
  }
  if (endTime !== undefined) {
    assert(typeof endTime === 'number', `MultiSign getMultiSignPayRequest, endTime should be an Number, now is ${typeof endTime}`);
  }

  const now = new Date()
  const where = {
    createdAt: {
      [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
      [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
    }
  };

  if (address) {
    assert(typeof address === 'string', `MultiSign getMultiSignPayRequest, address should be an String, now is ${typeof address}`);
    where.address = address;
  }
  if (txHash) {
    assert(typeof txHash === 'string', `MultiSign getMultiSignPayRequest, txHash should be an String, now is ${typeof txHash}`);
    where.txHash = txHash;
  }
  if (action) {
    assert(typeof action === 'string', `MultiSign getMultiSignPayRequest, action should be an String, now is ${typeof action}`);
    where.action = action;
  }
  if (timestamp) {
    assert(typeof timestamp === 'string', `MultiSign getMultiSignPayRequest, timestamp should be an String, now is ${typeof timestamp}`);
    where.timestamp = timestamp;
  }
  if (to) {
    assert(typeof to === 'string', `MultiSign getMultiSignPayRequest, to should be an String, now is ${typeof to}`);
    where.to = to;
  }
  if (value) {
    assert(typeof value === 'string', `MultiSign getMultiSignPayRequest, value should be an String, now is ${typeof value}`);
    where.value = value;
  }
  if (sponsor) {
    assert(typeof sponsor === 'string', `MultiSign getMultiSignPayRequest, sponsor should be an String, now is ${typeof sponsor}`);
    where.sponsor = sponsor;
  }

  return await mysql.MultiSignPayRequest.findAndCountAll({
    where: where,
    order: [['id', 'DESC']],
    offset: offset,
    limit: limit
  });
}

/**
 * @param {Number} offset
 * @param {Number} limit
 * @param {String} address
 * @param {String} txHash
 * @param {String} timestamp
 * @param {String} to
 * @param {String} value
 * @param {Number} beginTime
 * @param {Number} endTime
 */
const getMultiSignPay = async function({ offset, limit, address, txHash, timestamp, to, value, beginTime, endTime }) {
  assert(typeof offset === 'number', `MultiSign getMultiSignPay, offset should be an Number, now is ${typeof offset}`);
  assert(typeof limit === 'number', `MultiSign getMultiSignPay, limit should be an Number, now is ${typeof limit}`);

  if (beginTime !== undefined) {
    assert(typeof beginTime === 'number', `MultiSign getMultiSignPay, beginTime should be an Number, now is ${typeof beginTime}`);
  }
  if (endTime !== undefined) {
    assert(typeof endTime === 'number', `MultiSign getMultiSignPay, endTime should be an Number, now is ${typeof endTime}`);
  }

  const now = new Date()
  const where = {
    createdAt: {
      [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
      [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
    }
  };

  if (address) {
    assert(typeof address === 'string', `MultiSign getMultiSignPay, address should be an String, now is ${typeof address}`);
    where.address = address;
  }
  if (txHash) {
    assert(typeof txHash === 'string', `MultiSign getMultiSignPay, txHash should be an String, now is ${typeof txHash}`);
    where.txHash = txHash;
  }
  if (timestamp) {
    assert(typeof timestamp === 'string', `MultiSign getMultiSignPay, timestamp should be an String, now is ${typeof timestamp}`);
    where.timestamp = timestamp;
  }
  if (to) {
    assert(typeof to === 'string', `MultiSign getMultiSignPay, to should be an String, now is ${typeof to}`);
    where.to = to;
  }
  if (value) {
    assert(typeof value === 'string', `MultiSign getMultiSignPay, value should be an String, now is ${typeof value}`);
    where.value = value;
  }

  return await mysql.MultiSignPay.findAndCountAll({
    where: where,
    order: [['id', 'DESC']],
    offset: offset,
    limit: limit
  });
}

module.exports = {
  getMultiSignPayRequest,
  getMultiSignPay
}