const assert = require("assert");
const utils = require("../../depends/utils");
const Transaction = require("../../depends/transaction");

const Buffer = utils.Buffer;

const mysql = process[Symbol.for("mysql")];

const log4js = require("../logConfig");
const logger = log4js.getLogger();

/**
 * @param {Buffer} number
 * @param {Transaction} transaction
 */
const saveTransaction = async function(number, transaction)
{
  assert(Buffer.isBuffer(number), `Transactions saveTransaction, number should be an Buffer, now is ${typeof number}`);
  assert(transaction instanceof Transaction, `Transactions saveTransaction, transaction should be an Transaction Object, now is ${typeof transaction}`);

  try {
    await mysql.Transaction.create({
      hash: transaction.hash().toString('hex'),
      number: number.toString('hex'),
      nonce: transaction.nonce.toString('hex'),
      from: transaction.from.toString('hex'),
      to: transaction.to.toString('hex'),
      value: transaction.value.toString('hex'),
      data: transaction.data.toString('hex'),
      rawData: transaction.serialize().toString('hex')
    })
  }
  catch (e) {
    logger.error(`Transactions saveTransaction, throw exception ${e}`)
  }
}

/**
 * @param {Buffer} number
 * @param {Array/Transaction} transactions
 */
const saveTransactions = async function(number, transactions)
{
  assert(Buffer.isBuffer(number), `Transactions saveTransactions, number should be an Buffer, now is ${typeof number}`);
  assert(Array.isArray(transactions), `Transactions saveTransactions, transactions should be an Array, now is ${typeof transactions}`);

  for (let i = 0; i < transactions.length; i++) {
    await saveTransaction(number, transactions[i]);
  }
}

module.exports = {
  saveTransaction,
  saveTransactions
}