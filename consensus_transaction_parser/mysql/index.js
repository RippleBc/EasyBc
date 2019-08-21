const mysqlConfig = require("../config.json").mysql;
const Transaction = require("../../depends/transaction");
const utils = require("../../depends/utils");
const assert = require("assert");
const transactionModelConfig = require('./transaction');
const sendedSpvModelConfig = require('./sendedSpv');
const sideChainConfig = require('./sideChain');
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
    this.SendedSpv = this.sequelize.define(...sendedSpvModelConfig);
    this.SideChain = this.sequelize.define(...sideChainConfig);

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
        data: transaction.data.toString('hex'),
        rawData: transaction.serialize().toString('hex')
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
   * @param {String} chainCode
   */
  async saveSendedSpv(number, transaction, chainCode)
  {
    assert(Buffer.isBuffer(number), `Mysql saveSpv, number should be an Buffer, now is ${typeof number}`);
    assert(transaction instanceof Transaction, `Mysql saveSpv, transaction should be an Transaction Object, now is ${typeof transaction}`);
    assert(typeof chainCode === 'string', `Mysql saveSpv, chainCode should be an Buffer, now is ${typeof chainCode}`);

    try {
      await this.SendedSpv.create({
        hash: transaction.hash().toString('hex'),
        number: number.toString('hex'),
        chainCode: chainCode
      });
    }
    catch (e) {
      logger.error(`Mysql saveSpv, throw exception ${e}`)
    }
  }

  /**
   * @param {String} code
   */
  async getSideChain(code)
  {
    assert(typeof code === 'string', `Mysql getSideChain, code should be a String, now is ${typeof code}`);

    return await this.SideChain.findAll({
      attributes: ['url'],
      where: {
        code: code
      }
    });
  }
}

module.exports = Mysql;