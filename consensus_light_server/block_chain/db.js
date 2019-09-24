const Transaction = require("../../depends/transaction");
const utils = require("../../depends/utils");
const assert = require("assert");
const { Op } = require('sequelize');

const Buffer = utils.Buffer;

const mysql = process[Symbol.for("mysql")];

/**
 * @param {String} hash
 * @return {Transaction}
 */
const getTransaction = async function(hash)
{
  assert(typeof hash === "string", `BlockChain getTransaction, hash should be a String, now is ${typeof hash}`);

  const transaction = await mysql.Transaction.findOne({
    attributes: ['rawData'],
    where: {
      hash: hash
    }
  });

  if (transaction) {
    return new Transaction(Buffer.from(transaction.rawData, "hex"))
  }
}

/**
 * @param {Number} offset
 * @param {Number} limit
 * @param {String} hash
 * @param {String} from
 * @param {String} to
 * @param {Number} beginTime
 * @param {Number} endTime
 */
const getTransactions = async function({ offset, limit, hash, from, to, beginTime, endTime })
{
  assert(typeof offset === 'number', `BlockChain getTransactions, offset should be an Number, now is ${typeof offset}`);
  assert(typeof limit === 'number', `BlockChain getTransactions, limit should be an Number, now is ${typeof limit}`);

  if (hash) {
    assert(typeof hash === 'string', `BlockChain getTransactions, hash should be an String, now is ${typeof hash}`);
  }
  if (from) {
    assert(typeof from === 'string', `BlockChain getTransactions, from should be an String, now is ${typeof from}`);
  }
  if (to) {
    assert(typeof to === 'string', `BlockChain getTransactions, to should be an String, now is ${typeof to}`);
  }
  if (beginTime !== undefined) {
    assert(typeof beginTime === 'number', `BlockChain getTransactions, beginTime should be an Number, now is ${typeof beginTime}`);
  }
  if (endTime !== undefined) {
    assert(typeof endTime === 'number', `BlockChain getTransactions, endTime should be an Number, now is ${typeof endTime}`);
  }

  const now = new Date()
  const where = {
    createdAt: {
      [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
      [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
    }
  };
  if (hash) {
    where.hash = hash;
  }
  if (from) {
    where.from = from;
  }
  if (to) {
    where.to = to;
  }
  return await mysql.Transaction.findAndCountAll({
    where: where,
    order: [['id', 'DESC']],
    offset: offset,
    limit: limit
  });
}

/**
 * @param {String} hash
 * @return {String}
 */
const getRawTransaction = async function(hash)
{
  assert(typeof hash === 'string', `BlockChain getRawTransaction, hash should be a String, now is ${typeof hash}`)

  return await mysql.RawTransaction.findOne({
    where: {
      hash: hash
    }
  })
}


/**
 * @param {String} hash
 * @param {String} tx
 */
const saveRawTransaction = async function(hash, tx)
{
  assert(typeof hash === 'string', `BlockChain saveRawTransaction, hash should be a String, now is ${typeof hash}`)
  assert(typeof tx === 'string', `BlockChain saveRawTransaction, tx should be a String, now is ${typeof tx}`)

  await mysql.RawTransaction.create({
    hash: hash,
    data: tx
  })
}

/**
 * 
 */
const truncateTokenDistribution = async function () {
  await mysql.TokenDistribution.truncate();
}

/**
 * @param {String} address 
 * @param {String} balance blance should be an 64 length hex string
 */
const saveTokenDistribution = async function(address, balance) {
  assert(typeof address === 'string', `BlockChain saveTokenDistribution, address should be a String, now is ${typeof address}`)
  assert(typeof balance === 'string' && balance.length === 64, `BlockChain saveTokenDistribution, balance should be a String and its length should be 32, now is ${typeof balance}`)

  await mysql.TokenDistribution.create({
    address: address,
    balance: balance
  });
}


/**
 * @param {Number} offset
 * @param {Number} limit
 * @param {String} order
 */
const getTokenDistribution = async function ({ offset, limit, order}) {
  assert(typeof offset === 'number', `BlockChain getTokenDistribution, offset should be an Number, now is ${typeof offset}`);
  assert(typeof limit === 'number', `BlockChain getTokenDistribution, limit should be an Number, now is ${typeof limit}`);

  return await mysql.TokenDistribution.findAndCountAll({
    where: {

    },
    order: [['balance', order === 'asc' ? 'ASC' : 'DESC']],
    offset: offset,
    limit: limit
  });
}

module.exports = {
  getTransaction,
  getTransactions,
  getRawTransaction,
  saveRawTransaction,
  truncateTokenDistribution,
  saveTokenDistribution,
  getTokenDistribution
}