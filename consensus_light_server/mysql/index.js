const mysqlConfig = require("../config.json").mysql;
const Transaction = require("../../depends/transaction");
const utils = require("../../depends/utils");
const assert = require("assert");
const transactionModelConfig = require('./transaction');
const rawTransactionModelConfig = require('./rawTransaction');
const logModelConfig = require('./log');
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
    this.Transaction = this.sequelize.define(...transactionModelConfig);
    this.Log = this.sequelize.define(...logModelConfig);
    this.RawTransaction = this.sequelize.define(...rawTransactionModelConfig);
    this.TimeConsume = this.sequelize.define(...timeConsumeModelConfig);
    this.AbnormalNode = this.sequelize.define(...abnormalNodeModelConfig);

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
      attributes: ['data'],
      where: {
        hash: hash
      }
    });
    
    if(transaction)
    {
      return new Transaction(Buffer.from(transaction.data, 'hex'))
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
   *  @prop {String} type
   *  @prop {String} title
   *  @prop {Number} beginTime
   *  @prop {Number} endTime
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
}

module.exports = Mysql;