const mysqlConfig = require("../config.json").mysql;
const Transaction = require("../../depends/transaction");
const utils = require("../../depends/utils");
const assert = require("assert");
const rawTransactionModelConfig = require('./rawTransaction');
const timeConsumeModelConfig = require('./timeConsume');
const abnormalNodeModelConfig = require('./abnormalNode');
const counterHashModelConfig = require('./counterHash');
const perishHashModelConfig = require('./perishHash');
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
    this.RawTransaction = this.sequelize.define(...rawTransactionModelConfig);
    this.TimeConsume = this.sequelize.define(...timeConsumeModelConfig);
    this.AbnormalNode = this.sequelize.define(...abnormalNodeModelConfig);
    this.CounterHash = this.sequelize.define(...counterHashModelConfig);
    this.PerishHash = this.sequelize.define(...perishHashModelConfig);

    await this.sequelize.authenticate();
    await this.sequelize.sync();
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
   * @param {String} address
   * @param {String} reason
   */
  async saveTimeoutNode(address, reason)
  {
    assert(typeof address === 'string', `Mysql saveTimeoutNode, address should be a String, now is ${typeof address}`);
    assert(typeof reason === 'string', `Mysql saveTimeoutNode, reason should be a String, now is ${typeof reason}`);

    await this.AbnormalNode.create({
      address: address,
      type: 1,
      reason: reason
    })
  }

  /**
   * @param {String} address
   * @param {String} reason
   */
  async saveCheatedNode(address, reason)
  {
    assert(typeof address === 'string', `Mysql saveCheatedNode, address should be a String, now is ${typeof address}`);
    assert(typeof reason === 'string', `Mysql saveCheatedNode, reason should be a String, now is ${typeof reason}`);

    await this.AbnormalNode.create({
      address: address,
      type: 2,
      reason: reason
    })
  }

  /**
   * @param {String} hash
   */
  async checkIfCounterRepeated(hash)
  {
    assert(typeof hash === 'string', `Mysql checkIfCounterRepeated, hash should be a String, now is ${typeof hash}`);

    const [, created] = await this.CounterHash.findOrCreate({
      where: {
        hash: hash
      }
    });
    
    if(created)
    {
      return false;
    }

    return true;
  }

  /**
   * @param {String} hash
   */
  async checkIfPerishRepeated(hash)
  {
    assert(typeof hash === 'string', `Mysql checkIfPerishRepeated, hash should be a String, now is ${typeof hash}`);

    const [, created] = await this.PerishHash.findOrCreate({
      where: {
        hash: hash
      }
    });
    
    if(created)
    {
      return false;
    }
    
    return true;
  }
}

module.exports = Mysql;