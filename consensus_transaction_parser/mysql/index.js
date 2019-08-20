const mysqlConfig = require("../config.json").mysql;
const Transaction = require("../../depends/transaction");
const utils = require("../../depends/utils");
const assert = require("assert");
const transactionModelConfig = require('./transaction');
const spvModelConfig = require('./spv');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const log4js= require("../logConfig");

const logger = log4js.getLogger();

const Buffer = utils.Buffer;

class Mysql
{
  constructor()
  {
    this.sequelize = new Sequelize(mysqlConfig.dbName, mysqlConfig.user, mysqlConfig.password, {
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 2,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  }

  async init()
  {
    this.Transaction = this.sequelize.define(...transactionModelConfig);
    this.Spv = this.sequelize.define(...spvModelConfig);

    await this.sequelize.authenticate();
    await this.sequelize.sync();
  }

  /**
   * @param {Buffer} number
   * @param {Transaction} transaction
   */
  async saveTransaction(number, transaction)
  {
    assert(Buffer.isBuffer(number), `Mysql saveTransaction, number should be an Buffer, now is ${typeof number}`);
    assert(transaction instanceof Transaction, `Mysql saveTransaction, transaction should be an Transaction Object, now is ${typeof transaction}`);

    try
    {
      await this.Transaction.create({
        hash: transaction.hash().toString('hex'),
        number: number.toString('hex'),
        nonce: transaction.nonce.toString('hex'),
        from: transaction.from.toString('hex'),
        to: transaction.to.toString('hex'),
        value: transaction.value.toString('hex'),
        data: transaction.data.toString('hex')
      })
    }
    catch(e)
    {
      logger.error(`Mysql saveTransaction, throw exception ${e}`)
    }
  }

  /**
   * @param {Buffer} number
   * @param {Array/Transaction} transactions
   */
  async saveTransactions(number, transactions)
  {
    assert(Buffer.isBuffer(number), `Mysql saveTransactions, number should be an Buffer, now is ${typeof number}`);
    assert(Array.isArray(transactions), `Mysql saveTransactions, transactions should be an Array, now is ${typeof transactions}`);

    for(let i = 0; i < transactions.length; i++)
    {
      await this.saveTransaction(number, transactions[i]);
    }
  }

  /**
   * @param {Buffer} number
   * @param {Transaction} transaction
   * @param {Buffer} code
   */
  async saveSpv(number, transaction, code)
  {
    assert(Buffer.isBuffer(number), `Mysql saveSpv, number should be an Buffer, now is ${typeof number}`);
    assert(transaction instanceof Transaction, `Mysql saveSpv, transaction should be an Transaction Object, now is ${typeof transaction}`);
    assert(Buffer.isBuffer(code), `Mysql saveSpv, code should be an Buffer, now is ${typeof code}`);

    try {
      await this.Spv.create({
        hash: transaction.hash().toString('hex'),
        number: number.toString('hex'),
        code: code.toString('hex')
      });
    }
    catch (e) {
      logger.error(`Mysql saveSpv, throw exception ${e}`)
    }
  }
}

module.exports = Mysql;