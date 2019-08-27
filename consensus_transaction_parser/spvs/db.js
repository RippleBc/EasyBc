const assert = require("assert");
const utils = require("../../depends/utils");
const Transaction = require("../../depends/transaction");

const Buffer = utils.Buffer;

const mysql = process[Symbol.for("mysql")];

/**
 * @param {Buffer} number
 * @param {Transaction} transaction
 * @param {String} chainCode
 */
const saveSendedSpv = async function (number, transaction, chainCode) {
  assert(Buffer.isBuffer(number), `Spv saveSpv, number should be an Buffer, now is ${typeof number}`);
  assert(transaction instanceof Transaction, `Spv saveSpv, transaction should be an Transaction Object, now is ${typeof transaction}`);
  assert(typeof chainCode === 'string', `Spv saveSpv, chainCode should be an Buffer, now is ${typeof chainCode}`);


  return await mysql.SendedSpv.findOrCreate({
    where: {
      hash: transaction.hash().toString('hex'),
    },

    defaults: {
      number: number.toString('hex'),
      chainCode: chainCode
    }
  });
}

/**
 * @param {String} code
 */
const getSideChain = async function (code) {
  assert(typeof code === 'string', `Spv getSideChain, code should be a String, now is ${typeof code}`);

  return await mysql.SideChain.findAll({
    attributes: ['url'],
    where: {
      code: code
    }
  });
}

module.exports = {
  saveSendedSpv,
  getSideChain
}