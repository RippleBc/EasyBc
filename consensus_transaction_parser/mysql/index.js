const mysqlConfig = require("../config.json").mysql;
const Transaction = require("../../depends/transaction");
const utils = require("../../depends/utils");
const assert = require("assert");
const transactionModelConfig = require('./transaction');
const sendedSpvModelConfig = require('./sendedSpv');
const sideChainModelConfig = require('./sideChain');
const crossPayModelConfig = require('./crossPay');
const crossPayRequestModelConfig = require('./crossPayRequest');
const multiSignPayModelConfig = require('./multiSignPay');
const multiSignPayRequestModelConfig = require('./multiSignPayRequest');

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
    this.SideChain = this.sequelize.define(...sideChainModelConfig);
    this.CrossPay = this.sequelize.define(...crossPayModelConfig);
    this.CrossPayRequest = this.sequelize.define(...crossPayRequestModelConfig);
    this.MultiSignPay = this.sequelize.define(...multiSignPayModelConfig);
    this.MultiSignPayRequest = this.sequelize.define(...multiSignPayRequestModelConfig);

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

    
    return await this.SendedSpv.findOrCreate({
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

  /**
   * @param {Buffer} code
   * @param {Buffer} timestamp
   * @param {Buffer} txHash
   * @param {Buffer} number
   * @param {Buffer} to
   * @param {Buffer} value
   * @param {Buffer} sponsor
   */
  async saveCrossPayRequest(code, timestamp, txHash, number, to, value, sponsor)
  {
    assert(Buffer.isBuffer(code), `Mysql saveCrossPayRequest, code should be an Buffer, now is ${typeof code}`);
    assert(Buffer.isBuffer(timestamp), `Mysql saveCrossPayRequest, timestamp should be an Buffer, now is ${typeof timestamp}`);
    assert(Buffer.isBuffer(txHash), `Mysql saveCrossPayRequest, txHash should be an Buffer, now is ${typeof txHash}`);
    assert(Buffer.isBuffer(number), `Mysql saveCrossPayRequest, number should be an Buffer, now is ${typeof number}`);
    assert(Buffer.isBuffer(to), `Mysql saveCrossPayRequest, to should be an Buffer, now is ${typeof to}`);
    assert(Buffer.isBuffer(value), `Mysql saveCrossPayRequest, value should be an Buffer, now is ${typeof value}`);
    assert(Buffer.isBuffer(sponsor), `Mysql saveCrossPayRequest, sponsor should be an Buffer, now is ${typeof sponsor}`);

    try {
      await this.CrossPayRequest.create({
        code: code.toString('hex'),
        timestamp: timestamp.toString('hex'),
        txHash: txHash.toString('hex'),
        number: number.toString('hex'),
        to: to.toString('hex'),
        value: value.toString('hex'),
        sponsor: sponsor.toString('hex')
      });
    } catch (e) {
      logger.error(`Mysql saveCrossPayRequest, throw exception, ${e}`)
    }
  }

  /**
   * @param {Buffer} code
   * @param {Buffer} timestamp
   * @param {Buffer} txHash
   * @param {Buffer} to
   * @param {Buffer} value
   */
  async saveCrossPay(code, timestamp, txHash, to, value)
  {
    assert(Buffer.isBuffer(code), `Mysql saveCrossPay, code should be an Buffer, now is ${typeof code}`);
    assert(Buffer.isBuffer(timestamp), `Mysql saveCrossPay, timestamp should be an Buffer, now is ${typeof timestamp}`);
    assert(Buffer.isBuffer(txHash), `Mysql saveCrossPay, txHash should be an Buffer, now is ${typeof txHash}`);
    assert(Buffer.isBuffer(to), `Mysql saveCrossPay, to should be an Buffer, now is ${typeof to}`);
    assert(Buffer.isBuffer(value), `Mysql saveCrossPay, value should be an Buffer, now is ${typeof value}`);

    try
    {
      await this.CrossPay.create({
        code: code.toString('hex'),
        timestamp: timestamp.toString('hex'),
        txHash: txHash.toString('hex'),
        to: to.toString('hex'),
        value: value.toString('hex'),
      });
    }
    catch(e)
    {
      logger.error(`Mysql saveCrossPay, throw exception, ${e}`)
    }
  }

  /**
   * @param {Buffer} address
   * @param {Buffer} txHash
   * @param {Buffer} action
   * @param {Buffer} timestamp
   * @param {Buffer} to
   * @param {Buffer} value
   * @param {Buffer} sponsor
   */
  async saveMultiSignPayRequest(address, txHash, action, timestamp, to, value, sponsor)
  {
    assert(Buffer.isBuffer(address), `Mysql saveMultiSignPayRequest, address should be an Buffer, now is ${typeof address}`);
    assert(Buffer.isBuffer(txHash), `Mysql saveMultiSignPayRequest, txHash should be an Buffer, now is ${typeof txHash}`);
    assert(Buffer.isBuffer(action), `Mysql saveMultiSignPayRequest, action should be an Buffer, now is ${typeof action}`);
    assert(Buffer.isBuffer(timestamp), `Mysql saveMultiSignPayRequest, timestamp should be an Buffer, now is ${typeof timestamp}`);
    assert(Buffer.isBuffer(to), `Mysql saveMultiSignPayRequest, to should be an Buffer, now is ${typeof to}`);
    assert(Buffer.isBuffer(value), `Mysql saveMultiSignPayRequest, value should be an Buffer, now is ${typeof value}`);
    assert(Buffer.isBuffer(sponsor), `Mysql saveMultiSignPayRequest, sponsor should be an Buffer, now is ${typeof sponsor}`);

    try {
      await this.MultiSignPayRequest.create({
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
      logger.error(`Mysql saveCrossPay, throw exception, ${e}`)
    }
  }

  /**
   * @param {Buffer} address
   * @param {Buffer} txHash
   * @param {Buffer} timestamp
   * @param {Buffer} to
   * @param {Buffer} value
   */
  async saveMultiSignPay(address, txHash, timestamp, to, value)
  {
    assert(Buffer.isBuffer(address), `Mysql saveMultiSignPay, address should be an Buffer, now is ${typeof address}`);
    assert(Buffer.isBuffer(txHash), `Mysql saveMultiSignPay, txHash should be an Buffer, now is ${typeof txHash}`);
    assert(Buffer.isBuffer(timestamp), `Mysql saveMultiSignPay, timestamp should be an Buffer, now is ${typeof timestamp}`);
    assert(Buffer.isBuffer(to), `Mysql saveMultiSignPay, to should be an Buffer, now is ${typeof to}`);
    assert(Buffer.isBuffer(value), `Mysql saveMultiSignPay, value should be an Buffer, now is ${typeof value}`);
    
    try {
      await this.MultiSignPay.create({
        address: address.toString('hex'),
        txHash: txHash.toString('hex'),
        timestamp: timestamp.toString('hex'),
        to: to.toString('hex'),
        value: value.toString('hex'),
      });
    }
    catch (e) {
      logger.error(`Mysql saveCrossPay, throw exception, ${e}`)
    }
  }
}

module.exports = Mysql;