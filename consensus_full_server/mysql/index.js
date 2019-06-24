const mysqlConfig = require("../config.json").mysql;
const Account = require("../../depends/account");
const Block = require("../../depends/block");
const Transaction = require("../../depends/transaction");
const utils = require("../../depends/utils");
const assert = require("assert");
const accountModelConfig = require('./account');
const blockModelConfig = require('./block');
const transactionModelConfig = require('./transaction');
const rawTransactionModelConfig = require('./rawTransaction');
const timeConsumeModelConfig = require('./timeConsume');
const abnormalNodeModelConfig = require('./abnormalNode');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const Buffer = utils.Buffer;

class Mysql
{
  constructor()
  {
    this.sequelize = new Sequelize('consensus', mysqlConfig.user, mysqlConfig.password, {
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
    this.Account = this.sequelize.define(...accountModelConfig);
    this.Block = this.sequelize.define(...blockModelConfig);
    this.Transaction = this.sequelize.define(...transactionModelConfig);
    this.RawTransaction = this.sequelize.define(...rawTransactionModelConfig);
    this.TimeConsume = this.sequelize.define(...timeConsumeModelConfig);
    this.AbnormalNode = this.sequelize.define(...abnormalNodeModelConfig);

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
   * @param {Number} num
   */
  async getRawTransactions(num)
  {
    assert(typeof num === 'number', `Mysql getRawTransactions, num should be an Number, now is ${typeof num}`);

    const rawTransactions = await this.RawTransaction.findAll({
      limit: num
    });
    
    const result = rawTransactions.map(rawTransaction => {
      return Buffer.from(rawTransaction.data, 'hex');
    })

    for(let rawTransaction of rawTransactions)
    {
      await rawTransaction.destroy();
    }

    return result;
  }
  
  /**
   * @param {Number} stage
   * @param {Number} timeConsume
   */
  async saveDataExchangeTimeConsume(stage, timeConsume)
  {
    assert(typeof stage === 'number', `Mysql saveDataExchangeTimeConsume, stage should be a Number, now is ${typeof stage}`);
    assert(typeof timeConsume === 'number', `Mysql saveDataExchangeTimeConsume, timeConsume should be a Number, now is ${typeof timeConsume}`);

    await this.TimeConsume.create({ 
      stage: stage, 
      type: 1,
      data: timeConsume 
    });
  }

  /**
   * @param {Number} stage
   */
  async getDataExchangeTimeConsume(stage)
  {
    assert(typeof stage === 'number', `Mysql getDataExchangeTimeConsume, stage should be a Number, now is ${typeof stage}`);

    const limit = 100

    const total =  await this.TimeConsume.sum('data', {
      where: { 
        stage: stage, 
        type: 1
      },
      limit: limit,
    });

    return total / limit
  }

  /**
   * @param {Number} stage
   * @param {Number} timeConsume
   */
  async saveStageSynchronizeTimeConsume(stage, timeConsume)
  {
    assert(typeof stage === 'number', `Mysql saveDataExchangeTimeConsume, stage should be a Number, now is ${typeof stage}`);
    assert(typeof timeConsume === 'number', `Mysql saveDataExchangeTimeConsume, timeConsume should be a Number, now is ${typeof timeConsume}`);

    await this.TimeConsume.create({ 
      stage: stage, 
      type: 2,
      data: timeConsume 
    });
  }

  /**
   * @param {Number} stage
   */
  async getStageSynchronizeTimeConsume(stage)
  {
    assert(typeof stage === 'number', `Mysql getStageSynchronizeTimeConsume, stage should be a Number, now is ${typeof stage}`);

    const limit = 100
    
    const total =  await this.TimeConsume.sum('data', {
      where: { 
        stage: stage, 
        type: 2
      },
      limit: limit,
    });

    return total / limit
  }

  /**
   * @param {String} address
   */
  async saveTimeoutNode(address)
  {
    assert(typeof address === 'string', `Mysql saveTimeoutNode, address should be a String, now is ${typeof address}`);

    await this.AbnormalNode.create({
      address: address, 
      type: 1
    })
  }

  /**
   * @param {String} address
   */
  async saveCheatedNode(address)
  {
    assert(typeof address === 'string', `Mysql saveCheatedNode, address should be a String, now is ${typeof address}`);
    
    await this.AbnormalNode.create({
      address: address, 
      type: 2
    })
  }
}

module.exports = Mysql;