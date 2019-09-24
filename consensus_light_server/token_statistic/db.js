const assert = require("assert");

const mysql = process[Symbol.for("mysql")];

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
const saveTokenDistribution = async function (address, balance) {
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
const getTokenDistribution = async function ({ offset, limit, order }) {
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
  truncateTokenDistribution,
  saveTokenDistribution,
  getTokenDistribution
}