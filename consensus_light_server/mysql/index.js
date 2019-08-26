const mysqlConfig = require("../config.json").mysql;
const Transaction = require("../../depends/transaction");
const utils = require("../../depends/utils");
const assert = require("assert");
const transactionModelConfig = require('../../depends/mysql_model/transaction');
const rawTransactionModelConfig = require('../../depends/mysql_model/rawTransaction');
const logModelConfig = require('../../depends/mysql_model/log');
const timeConsumeModelConfig = require('../../depends/mysql_model/timeConsume');
const abnormalNodeModelConfig = require('../../depends/mysql_model/abnormalNode');
const sideChainModelConfig = require('../../depends/mysql_model/sideChain');
const receivedSpvModelConfig = require('../../depends/mysql_model/receivedSpv');
const sideChainConstractModelConfig = require('../../depends/mysql_model/sideChainConstract');
const waitingCrossPayModelConfig = require('../../depends/mysql_model/waitingCrossPay');
const crossPayModelConfig = require('../../depends/mysql_model/crossPay');
const crossPayRequestModelConfig = require('../../depends/mysql_model/crossPayRequest');
const multiSignPayModelConfig = require('../../depends/mysql_model/multiSignPay');
const multiSignPayRequestModelConfig = require('../../depends/mysql_model/multiSignPayRequest');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const Buffer = utils.Buffer;

const WAITING_CROSS_PAY_FLUSH_COUNT_LIMIT = 50;
const WAITING_CROSS_PAY_FLUSH_SECONDS_INTERVAL_THRESHOLD = 5;
var waitingCrossPayLastFlushTime = 0;

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
    this.Log = this.sequelize.define(...logModelConfig);
    this.RawTransaction = this.sequelize.define(...rawTransactionModelConfig);
    this.TimeConsume = this.sequelize.define(...timeConsumeModelConfig);
    this.AbnormalNode = this.sequelize.define(...abnormalNodeModelConfig);
    this.SideChain = this.sequelize.define(...sideChainModelConfig)
    this.ReceivedSpv = this.sequelize.define(...receivedSpvModelConfig);
    this.SideChainConstract = this.sequelize.define(...sideChainConstractModelConfig);
    this.WaitingCrossPay = this.sequelize.define(...waitingCrossPayModelConfig);
    this.CrossPay = this.sequelize.define(...crossPayModelConfig);
    this.CrossPayRequest = this.sequelize.define(...crossPayRequestModelConfig);
    this.MultiSignPay = this.sequelize.define(...multiSignPayModelConfig);
    this.MultiSignPayRequest = this.sequelize.define(...multiSignPayRequestModelConfig);

    await this.sequelize.authenticate();
    await this.sequelize.sync();
  }

  /**
   * @param {String} hash
   * @return {Transaction}
   */
  async getTransaction(hash)
  {
    assert(typeof hash === "string", `Mysql getTransaction, hash should be a String, now is ${typeof hash}`);

    const transaction = await this.Transaction.findOne({
      attributes: ['rawData'],
      where: {
        hash: hash
      }
    });
    
    if(transaction)
    {
      return new Transaction(Buffer.from(transaction.rawData, "hex"))
    }
  }
  
  /**
   * @param {Object}
   *  @prop {String} hash
   *  @prop {String} from
   *  @prop {String} to
   *  @prop {Number} beginTime
   *  @prop {Number} endTime
   */
  async getTransactions({offset, limit, hash, from, to, beginTime, endTime})
  {
    assert(typeof offset === 'number', `Mysql getTransactions, offset should be an Number, now is ${typeof offset}`);
    assert(typeof limit === 'number', `Mysql getTransactions, limit should be an Number, now is ${typeof limit}`);
    
    if(hash)
    {
      assert(typeof hash === 'string', `Mysql getTransactions, hash should be an String, now is ${typeof hash}`);
    }
    if(from)
    {
      assert(typeof from === 'string', `Mysql getTransactions, from should be an String, now is ${typeof from}`);
    }
    if(to)
    {
      assert(typeof to === 'string', `Mysql getTransactions, to should be an String, now is ${typeof to}`);
    }
    if(beginTime !== undefined)
    {
      assert(typeof beginTime === 'number', `Mysql getTransactions, beginTime should be an Number, now is ${typeof beginTime}`);
    }
    if(endTime !== undefined)
    {
      assert(typeof endTime === 'number', `Mysql getTransactions, endTime should be an Number, now is ${typeof endTime}`);
    }

    const now = new Date()
    const where = {
      createdAt: {
        [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
        [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
      }
    };
    if(hash)
    {
      where.hash = hash;
    }
    if(from)
    {
      where.from = from;
    }
    if(to)
    {
      where.to = to;
    }
    return await this.Transaction.findAndCountAll({
      where: where,
      order: [['id', 'DESC' ]],
      offset: offset,
      limit: limit
    });
  }

  /**
   * @param {String} hash
   * @return {String}
   */
  async getRawTransaction(hash)
  {
    assert(typeof hash === 'string', `Mysql getRawTransaction, hash should be a String, now is ${typeof hash}`)

    return await this.RawTransaction.findOne({
      where: {
        hash: hash
      }
    })
  }


  /**
   * @param {String} hash
   * @param {String} tx
   */
  async saveRawTransaction(hash, tx)
  {
    assert(typeof hash === 'string', `Mysql saveRawTransaction, hash should be a String, now is ${typeof hash}`)
    assert(typeof tx === 'string', `Mysql saveRawTransaction, tx should be a String, now is ${typeof tx}`)

    await this.RawTransaction.create({
      hash: hash,
      data: tx
    })
  }

  /**
   * @param {Object}
   * @prop {String} type
   * @prop {String} title
   * @prop {Number} beginTime
   * @prop {Number} endTime
   */
  async getLogs({offset, limit, type, title, beginTime, endTime})
  {
    assert(typeof offset === 'number', `Mysql getLogs, offset should be an Number, now is ${typeof offset}`);
    assert(typeof limit === 'number', `Mysql getLogs, limit should be an Number, now is ${typeof limit}`);

    if(type !== undefined)
    {
      assert(typeof type === 'string', `Mysql getLogs, type should be an String, now is ${typeof type}`);
    }
    if(title)
    {
      assert(typeof title === 'string', `Mysql getLogs, title should be an String, now is ${typeof title}`);
    }
    if(beginTime !== undefined)
    {
      assert(typeof beginTime === 'number', `Mysql getLogs, beginTime should be an Number, now is ${typeof beginTime}`);
    }
    if(endTime !== undefined)
    {
      assert(typeof endTime === 'number', `Mysql getLogs, endTime should be an Number, now is ${typeof endTime}`);
    }

    const now = new Date()
    const where = {
      createdAt: {
        [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
        [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
      }
    };
    if(type)
    {
      where.type = type;
    }
    if(title)
    {
      where.title = title;
    }
    return await this.Log.findAndCountAll({
      where: where,
      limit: limit,
      offset: offset,
      order: [['id', 'DESC' ]]
    });
  }

  /**
   * @param {Object}
   *  @prop {String} type
   *  @prop {Number} beginTime
   *  @prop {Number} endTime
   */
  async getTimeConsume({offset, limit, type, stage, beginTime, endTime})
  {
    assert(typeof offset === 'number', `Mysql getTimeConsume, offset should be an Number, now is ${typeof offset}`);
    assert(typeof limit === 'number', `Mysql getTimeConsume, limit should be an Number, now is ${typeof limit}`);

    if(type !== undefined)
    {
      assert(typeof type === 'number', `Mysql getTimeConsume, type should be an Number, now is ${typeof type}`);
    }
    if(stage)
    {
      assert(typeof stage === 'number', `Mysql getTimeConsume, stage should be an Number, now is ${typeof stage}`);
    }
    if(beginTime !== undefined)
    {
      assert(typeof beginTime === 'number', `Mysql getTimeConsume, beginTime should be an Number, now is ${typeof beginTime}`);
    }
    if(endTime !== undefined)
    {
      assert(typeof endTime === 'number', `Mysql getTimeConsume, endTime should be an Number, now is ${typeof endTime}`);
    }

    const now = new Date()
    const where = {
      createdAt: {
        [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
        [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
      }
    };
    if(type)
    {
      where.type = type;
    }
    if(stage)
    {
      where.stage = stage;
    }
    return await this.TimeConsume.findAll({
      where: where,
      limit: limit,
      offset: offset,
      order: [['id', 'DESC' ]]
    });
  }

  async getAbnormalNodes({offset, limit, type, beginTime, endTime})
  {
    assert(typeof type === 'number', `Mysql getAbnormalNodes, type should be an Number, now is ${typeof type}`);
    assert(typeof offset === 'number', `Mysql getAbnormalNodes, offset should be an Number, now is ${typeof offset}`);
    assert(typeof limit === 'number', `Mysql getAbnormalNodes, limit should be an Number, now is ${typeof limit}`);

    if(beginTime !== undefined)
    {
      assert(typeof beginTime === 'number', `Mysql getAbnormalNodes, beginTime should be an Number, now is ${typeof beginTime}`);
    }
    if(endTime !== undefined)
    {
      assert(typeof endTime === 'number', `Mysql getAbnormalNodes, endTime should be an Number, now is ${typeof endTime}`);
    }

    const now = new Date()
    const where = {
      createdAt: {
        [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
        [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
      }
    };
    if(type)
    {
      where.type = type;
    }

    return await this.AbnormalNode.findAll({
      attributes: ['address', [this.sequelize.fn('count', this.sequelize.col('address')), 'frequency']],
      raw: true,
      where: where,
      group: ['address'],
      limit: limit,
      offset: offset
    });
  }

  /**
   * @param {Buffer} code
   */
  async getSideChain(code) {
    assert(typeof code === 'string', `Mysql getSideChain, code should be a String, now is ${typeof code}`);

    return await this.SideChain.findAndCountAll({
      attributes: ['url'],
      where: {
        code: code.toString("hex")
      }
    });
  }
  /**
   * @param {String} code
   * @param {String} url
   */
  async saveSideChain(code, url)
  {
    assert(typeof code === 'string', `Mysql saveSideChain, code should be a String, now is ${typeof code}`);
    assert(typeof url === 'string', `Mysql saveSideChain, code should be a String, now is ${typeof code}`);

    await this.SideChain.create({
      code: code,
      url: url
    })
  }

  /**
   * @param {String} hash
   * @param {String} number
   * @param {String} chainCode
   * @return {Array} [receivedSpv, created]
   */
  async saveReceivedSpv(hash, number, chainCode) {
    assert(typeof hash === 'string', `Mysql saveSpv, hash should be a String, now is ${typeof hash}`);
    assert(typeof number === 'string', `Mysql saveSpv, number should be a String, now is ${typeof number}`);
    assert(typeof chainCode === 'string', `Mysql saveSpv, chainCode should be a String, now is ${typeof chainCode}`);
    
    return await this.ReceivedSpv.findOrCreate({
      where: {
        hash: hash,
        number: number,
        chainCode: chainCode
      },
      defaults: {

      }
    });
  }

  /**
   * @param {String} chainCode
   * @return {Buffer} address
   */
  async getSideChainConstract(chainCode)
  {
    assert(typeof chainCode === 'string', `Mysql getSideChainConstract, chainCode should be a String, now is ${typeof chainCode}`);

    const sideChainConstract = await this.SideChainConstract.findOne({
      attributes: ['address'],
      where: {
        chainCode: chainCode
      }
    });

    return sideChainConstract.address;
  }

  /**
   * @param {String} hash
   * @param {String} number
   * @param {String} chainCode
   * @param {String} to
   * @param {String} value
   * @return {Array} [receivedSpv, created]
   */
  async saveWaitingCrossPay(hash, number, chainCode, to, value) {
    assert(typeof hash === 'string', `Mysql saveWaitingCrossPay, hash should be a String, now is ${typeof hash}`);
    assert(typeof number === 'string', `Mysql saveWaitingCrossPay, number should be a String, now is ${typeof number}`);
    assert(typeof chainCode === 'string', `Mysql saveWaitingCrossPay, chainCode should be a String, now is ${typeof chainCode}`);
    assert(typeof to === 'string', `Mysql saveWaitingCrossPay, to should be a String, now is ${typeof to}`);
    assert(typeof value === 'string', `Mysql saveWaitingCrossPay, value should be a String, now is ${typeof value}`);

    return await this.WaitingCrossPay.findOrCreate({
      where: {
        hash: hash,
        number: number,
        chainCode: chainCode
      },
      defaults: {
        to: to,
        value: value
      }
    });
  }

  async getWaitingCrossPay() {
    // check interval
    const now = Date.now();
    if (now - waitingCrossPayLastFlushTime < WAITING_CROSS_PAY_FLUSH_SECONDS_INTERVAL_THRESHOLD * 1000) {
      return [];
    }
    waitingCrossPayLastFlushTime = now;

    // fetch data
    const rows = await this.WaitingCrossPay.findAll({
      limit: WAITING_CROSS_PAY_FLUSH_COUNT_LIMIT,
      order: [['id', 'ASC']]
    });

    return rows;
  }

  /**
   * @param {Buffer} offset
   * @param {Buffer} limit
   * @param {Buffer} code
   * @param {Buffer} timestamp
   * @param {Buffer} txHash
   * @param {Buffer} number
   * @param {Buffer} to
   * @param {Buffer} value
   * @param {Buffer} sponsor
   * @param {Buffer} beginTime
   * @param {Buffer} endTime
   */
  async getCrossPayRequest({offset, limit, code, timestamp, txHash, number, to, value, sponsor, beginTime, endTime}) {
    assert(typeof offset === 'number', `Mysql getCrossPayRequest, offset should be an Number, now is ${typeof offset}`);
    assert(typeof limit === 'number', `Mysql getCrossPayRequest, limit should be an Number, now is ${typeof limit}`);

    if (beginTime !== undefined) {
      assert(typeof beginTime === 'number', `Mysql getCrossPayRequest, beginTime should be an Number, now is ${typeof beginTime}`);
    }
    if (endTime !== undefined) {
      assert(typeof endTime === 'number', `Mysql getCrossPayRequest, endTime should be an Number, now is ${typeof endTime}`);
    }

    const now = new Date()
    const where = {
      createdAt: {
        [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
        [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
      }
    };

    if (code) {
      assert(typeof code === 'string', `Mysql getCrossPayRequest, code should be an String, now is ${typeof code}`);
      where.code = code;
    }
    if (timestamp !== undefined) {
      assert(typeof timestamp === 'number', `Mysql getCrossPayRequest, timestamp should be an Number, now is ${typeof timestamp}`);
      where.timestamp = timestamp;
    }
    if (txHash) {
      assert(typeof txHash === 'string', `Mysql getCrossPayRequest, txHash should be an String, now is ${typeof txHash}`);
      where.txHash = txHash;
    }
    if (number) {
      assert(typeof number === 'string', `Mysql getCrossPayRequest, number should be an String, now is ${typeof number}`);
      where.number = number;
    }
    if (to) {
      assert(typeof to === 'string', `Mysql getCrossPayRequest, to should be an String, now is ${typeof to}`);
      where.to = to;
    }
    if (value) {
      assert(typeof value === 'string', `Mysql getCrossPayRequest, value should be an String, now is ${typeof value}`);
      where.value = value;
    }
    if (sponsor) {
      assert(typeof sponsor === 'string', `Mysql getCrossPayRequest, sponsor should be an String, now is ${typeof sponsor}`);
      where.sponsor = sponsor;
    }

    return await this.CrossPayRequest.findAndCountAll({
      where: where,
      order: [['id', 'DESC']],
      offset: offset,
      limit: limit
    });
  }

  /**
   * @param {Number} offset
   * @param {Number} limit
   * @param {String} code
   * @param {String} timestamp
   * @param {String} txHash
   * @param {String} to
   * @param {String} value
   * @param {Number} beginTime
   * @param {Number} endTime
   */
  async getCrossPay({offset, limit, code, timestamp, txHash, to, value, beginTime, endTime}) {
    assert(typeof offset === 'number', `Mysql getCrossPay, offset should be an Number, now is ${typeof offset}`);
    assert(typeof limit === 'number', `Mysql getCrossPay, limit should be an Number, now is ${typeof limit}`);

    if (beginTime !== undefined) {
      assert(typeof beginTime === 'number', `Mysql getCrossPay, beginTime should be an Number, now is ${typeof beginTime}`);
    }
    if (endTime !== undefined) {
      assert(typeof endTime === 'number', `Mysql getCrossPay, endTime should be an Number, now is ${typeof endTime}`);
    }

    const now = new Date()
    const where = {
      createdAt: {
        [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
        [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
      }
    };

    if (code) {
      assert(typeof code === 'string', `Mysql getCrossPay, code should be an String, now is ${typeof code}`);
      where.code = code;
    }
    if (timestamp) {
      assert(typeof timestamp === 'string', `Mysql getCrossPay, timestamp should be an String, now is ${typeof timestamp}`);
      where.timestamp = timestamp;
    }
    if (txHash) {
      assert(typeof txHash === 'string', `Mysql getCrossPay, txHash should be an String, now is ${typeof txHash}`);
      where.txHash = txHash;
    }
    if (to) {
      assert(typeof to === 'string', `Mysql getCrossPay, to should be an String, now is ${typeof to}`);
      where.to = to;
    }
    if (value) {
      assert(typeof value === 'string', `Mysql getCrossPay, value should be an String, now is ${typeof value}`);
      where.value = value;
    }

    return await this.CrossPay.findAndCountAll({
      where: where,
      order: [['id', 'DESC']],
      offset: offset,
      limit: limit
    });
  }

  /**
   * @param {Number} offset
   * @param {Number} limit
   * @param {Buffer} address
   * @param {Buffer} txHash
   * @param {Buffer} action
   * @param {Buffer} timestamp
   * @param {Buffer} to
   * @param {Buffer} value
   * @param {Buffer} sponsor
   * @param {Number} beginTime
   * @param {Number} endTime
   */
  async getMultiSignPayRequest({ offset, limit, address, txHash, action, timestamp, to, value, sponsor, beginTime, endTime}) {
    assert(typeof offset === 'number', `Mysql getMultiSignPayRequest, offset should be an Number, now is ${typeof offset}`);
    assert(typeof limit === 'number', `Mysql getMultiSignPayRequest, limit should be an Number, now is ${typeof limit}`);

    if (beginTime !== undefined) {
      assert(typeof beginTime === 'number', `Mysql getMultiSignPayRequest, beginTime should be an Number, now is ${typeof beginTime}`);
    }
    if (endTime !== undefined) {
      assert(typeof endTime === 'number', `Mysql getMultiSignPayRequest, endTime should be an Number, now is ${typeof endTime}`);
    }

    const now = new Date()
    const where = {
      createdAt: {
        [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
        [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
      }
    };

    if (address) {
      assert(typeof address === 'string', `Mysql getMultiSignPayRequest, address should be an String, now is ${typeof address}`);
      where.address = address;
    }
    if (txHash) {
      assert(typeof txHash === 'string', `Mysql getMultiSignPayRequest, txHash should be an String, now is ${typeof txHash}`);
      where.txHash = txHash;
    }
    if (action) {
      assert(typeof action === 'string', `Mysql getMultiSignPayRequest, action should be an String, now is ${typeof action}`);
      where.action = action;
    }
    if (timestamp) {
      assert(typeof timestamp === 'string', `Mysql getMultiSignPayRequest, timestamp should be an String, now is ${typeof timestamp}`);
      where.timestamp = timestamp;
    }
    if (to) {
      assert(typeof to === 'string', `Mysql getMultiSignPayRequest, to should be an String, now is ${typeof to}`);
      where.to = to;
    }
    if (value) {
      assert(typeof value === 'string', `Mysql getMultiSignPayRequest, value should be an String, now is ${typeof value}`);
      where.value = value;
    }
    if (sponsor) {
      assert(typeof sponsor === 'string', `Mysql getMultiSignPayRequest, sponsor should be an String, now is ${typeof sponsor}`);
      where.sponsor = sponsor;
    }

    return await this.MultiSignPayRequest.findAndCountAll({
      where: where,
      order: [['id', 'DESC']],
      offset: offset,
      limit: limit
    });
  }

  /**
   * @param {Number} offset
   * @param {Number} limit
   * @param {Buffer} address
   * @param {Buffer} txHash
   * @param {Buffer} timestamp
   * @param {Buffer} to
   * @param {Buffer} value
   * @param {Number} beginTime
   * @param {Number} endTime
   */
  async getMultiSignPay({offset, limit, address, txHash, timestamp, to, value, beginTime, endTime}) {
    assert(typeof offset === 'number', `Mysql getMultiSignPay, offset should be an Number, now is ${typeof offset}`);
    assert(typeof limit === 'number', `Mysql getMultiSignPay, limit should be an Number, now is ${typeof limit}`);

    if (beginTime !== undefined) {
      assert(typeof beginTime === 'number', `Mysql getMultiSignPay, beginTime should be an Number, now is ${typeof beginTime}`);
    }
    if (endTime !== undefined) {
      assert(typeof endTime === 'number', `Mysql getMultiSignPay, endTime should be an Number, now is ${typeof endTime}`);
    }

    const now = new Date()
    const where = {
      createdAt: {
        [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
        [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
      }
    };
    
    if (address) {
      assert(typeof address === 'string', `Mysql getMultiSignPay, address should be an String, now is ${typeof address}`);
      where.address = address;
    }
    if (txHash) {
      assert(typeof txHash === 'string', `Mysql getMultiSignPay, txHash should be an String, now is ${typeof txHash}`);
      where.txHash = txHash;
    }
    if (timestamp) {
      assert(typeof timestamp === 'string', `Mysql getMultiSignPay, timestamp should be an String, now is ${typeof timestamp}`);
      where.timestamp = timestamp;
    }
    if (to) {
      assert(typeof to === 'string', `Mysql getMultiSignPay, to should be an String, now is ${typeof to}`);
      where.to = to;
    }
    if (value) {
      assert(typeof value === 'string', `Mysql getMultiSignPay, value should be an String, now is ${typeof value}`);
      where.value = value;
    }

    return await this.MultiSignPay.findAndCountAll({
      where: where,
      order: [['id', 'DESC']],
      offset: offset,
      limit: limit
    });
  }
}

module.exports = Mysql;