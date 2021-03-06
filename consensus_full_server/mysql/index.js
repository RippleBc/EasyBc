const mysqlConfig = require("../config.json").mysql;
const utils = require("../../depends/utils");
const assert = require("assert");
const rawTransactionModelConfig = require('../../depends/mysql_model/rawTransaction');
const abnormalNodeModelConfig = require('../../depends/mysql_model/abnormalNode');
const sideChainConstractModelConfig = require('../../depends/mysql_model/sideChainConstract');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const logger = process[Symbol.for("loggerMysql")];

const Buffer = utils.Buffer;

let ifDeletingRawTransactions = false;
let ifGettingRawTransactions = false;

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
    this.RawTransaction = this.sequelize.define(...rawTransactionModelConfig);
    this.AbnormalNode = this.sequelize.define(...abnormalNodeModelConfig);
    this.SideChainConstract = this.sequelize.define(...sideChainConstractModelConfig);

    await this.sequelize.authenticate();
    await this.sequelize.sync();
  }

  /**
   * @param {Number} num
   * @return {Object} 
   *  - {Array} transactions
   *  - {Function} deleteTransactions
   */
  async getRawTransactions(num)
  {
    assert(typeof num === 'number', `Mysql getRawTransactions, num should be an Number, now is ${typeof num}`);

    if (ifGettingRawTransactions)
    {
      await Promise.reject("Mysql getRawTransactions, can not gettingRawTransactions at the same time");
    }
    ifGettingRawTransactions = true;

    while(ifDeletingRawTransactions)
    {
      await new Promise(resolve => {
        setTimeout(() => {
          resolve();
        });
      });
    }

    const rawTransactions = await this.RawTransaction.findAll({
      limit: num
    });
    
    ifGettingRawTransactions = false;

    const result = rawTransactions.map(rawTransaction => {
      return Buffer.from(rawTransaction.data, 'hex');
    })

    return {
      transactions: result,
      deleteTransactions: async () => {

        if (ifDeletingRawTransactions)
        {
          await Promise.reject("Mysql getRawTransactions, can not deleteTransactions at the same time");
        }
        ifDeletingRawTransactions = true;

        for(let rawTransaction of rawTransactions)
        {
          logger.info(`Mysql getRawTransactions, del tx, hash: ${rawTransaction.hash}`);

          await rawTransaction.destroy();
        }

        ifDeletingRawTransactions = false;
      }
    };
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
   * @param {Buffer} chainCode 
   * @param {Buffer} address 
   * @return {Array} [sideChainConstract, created]
   */
  async saveSideChainConstract(chainCode, address)
  {
    assert(Buffer.isBuffer(chainCode), `Mysql saveSideChainConstract, chainCode should be an Buffer, now is ${typeof chainCode}`);
    assert(Buffer.isBuffer(address), `Mysql saveSideChainConstract, address should be an Buffer, now is ${typeof address}`);

    return await this.SideChainConstract.findOrCreate({
      where: {
        chainCode: chainCode.toString('hex')
      },
      defaults: {
        address: address.toString('hex')
      }
    });
  }

  /**
   * @param {Buffer} chainCode 
   * @param {Buffer} address 
   */
  async updateSideChainConstract(chainCode, address)
  {
    assert(Buffer.isBuffer(chainCode), `Mysql updateSideChainConstract, chainCode should be an Buffer, now is ${typeof chainCode}`);
    assert(Buffer.isBuffer(address), `Mysql updateSideChainConstract, address should be an Buffer, now is ${typeof address}`);

    await this.SideChainConstract.update({
      address: address.toString('hex')
    }, {
      where: {
        chainCode: chainCode.toString('hex')
      }
    })
  }
}

module.exports = Mysql;