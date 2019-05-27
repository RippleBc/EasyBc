const mysql = require("mysql");
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
    this.Account = this.sequelize.define(...accountModelConfig);
    this.Block = this.sequelize.define(...blockModelConfig);
    this.Transaction = this.sequelize.define(...transactionModelConfig);
    this.Log = this.sequelize.define(...logModelConfig);
    this.RawTransaction = this.sequelize.define(...rawTransactionModelConfig);
    this.TimeConsume = this.sequelize.define(...timeConsumeModelConfig);
    this.AbnormalNode = this.sequelize.define(...abnormalNodeModelConfig);

    await this.sequelize.authenticate();
    await this.sequelize.sync();
  }

  /**
   * @param {Buffer} number
   * @return {Buffer}
   */
  async getBlockHashByNumber(number)
  {
    assert(Buffer.isBuffer(number), `Mysql getBlockHashByNumber, number should be an Buffer, now is ${typeof number}`);

    const block = await this.Block.findOne({
      attributes: ['hash'],
      where: {
        number: number.toString('hex')
      }
    });
  
    if(block)
    {
      return Buffer.from(block.hash, "hex");
    }
  }

  /*
   * @return {Buffer}
   */
  async getBlockChainHeight()
  {
    const block = await this.Block.findOne({
      attributes: ['number'],
      order: [['number', 'DESC']]
    });
  
    if(block)
    {
      return Buffer.from(block.number, "hex");
    }
  }

  /**
   * @param {Buffer} hash
   * @return {Block}
   */
  async getBlockByHash(hash)
  {
    assert(Buffer.isBuffer(hash), `Mysql getBlockByHash, hash should be an Buffer, now is ${typeof hash}`);

    const block = await this.Block.findOne({
      attributes: ['data'],
      where: {
        hash: hash.toString('hex')
      }
    });
  
    if(block)
    {
      return new Block(Buffer.from(block.data, "hex"));
    }
  }

  /**
   * @param {Buffer} number
   * @return {Block}
   */
  async getBlockByNumber(number)
  {
    assert(Buffer.isBuffer(number), `Mysql getBlockByNumber, number should be an Buffer, now is ${typeof number}`);

    const block = await this.Block.findOne({
      attributes: ['data'],
      where: {
        number: number.toString('hex')
      }
    });
  
    if(block)
    {
      return new Block(Buffer.from(block.data, "hex"));
    }
  }

  /**
   * @param number {String}
   * @param stateRoot {String}
   * @param address {String}
   * @return {Account}
   */
  async getAccount(number, stateRoot, address)
  {
    assert(typeof number === "string", `Mysql getAccount, number should be a String, now is ${typeof number}`);
    assert(typeof stateRoot === "string", `Mysql getAccount, stateRoot should be a String, now is ${typeof stateRoot}`);
    assert(typeof address === "string", `Mysql getAccount, address should be a String, now is ${typeof address}`);

    const account = await this.Account.findOne({
      attributes: ['data'],
      order: [['number', 'DESC']],
      where: {
        address: address,
        [Op.or]: [
          {
            stateRoot: stateRoot
          },
          {
            number: {
              [Op.lte]: number
            }
          }
        ]
      }
    });

    if(account)
    {
      return new Account(Buffer.from(account.data, 'hex'))
    }
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
  async getTransactions({hash, from, to, beginTime, endTime})
  {
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
    if(beginTime)
    {
      assert(typeof beginTime === 'number', `Mysql getTransactions, beginTime should be an Number, now is ${typeof beginTime}`);
    }
    if(endTime)
    {
      assert(typeof endTime === 'number', `Mysql getTransactions, endTime should be an Number, now is ${typeof endTime}`);
    }

    const now = new Date()
    const where = {
      createdAt: {
        [Op.gt]: beginTime ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
        [Op.lt]: endTime ? new Date(endTime) : now,
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
    return await this.Transaction.findAll({
      where: where,
      order: [['id', 'DESC' ]]
    });
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
  async getLogs({type, title, beginTime, endTime})
  {
    if(type)
    {
      assert(typeof type === 'string', `Mysql getLogs, type should be an String, now is ${typeof type}`);
    }
    if(title)
    {
      assert(typeof title === 'string', `Mysql getLogs, title should be an String, now is ${typeof title}`);
    }
    if(beginTime)
    {
      assert(typeof beginTime === 'number', `Mysql getLogs, beginTime should be an Number, now is ${typeof beginTime}`);
    }
    if(endTime)
    {
      assert(typeof endTime === 'number', `Mysql getLogs, endTime should be an Number, now is ${typeof endTime}`);
    }

    const now = new Date()
    const where = {
      createdAt: {
        [Op.gt]: beginTime ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
        [Op.lt]: endTime ? new Date(endTime) : now,
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
      limit: 500,
      order: [['id', 'DESC' ]]
    });
  }

  /**
   * @param {Object}
   *  @prop {String} type
   *  @prop {Number} beginTime
   *  @prop {Number} endTime
   */
  async getTimeConsume({type, stage, beginTime, endTime})
  {
    if(type)
    {
      assert(typeof type === 'number', `Mysql getTimeConsume, type should be an Number, now is ${typeof type}`);
    }
    if(stage)
    {
      assert(typeof stage === 'number', `Mysql getTimeConsume, stage should be an Number, now is ${typeof stage}`);
    }
    if(beginTime)
    {
      assert(typeof beginTime === 'number', `Mysql getTimeConsume, beginTime should be an Number, now is ${typeof beginTime}`);
    }
    if(endTime)
    {
      assert(typeof endTime === 'number', `Mysql getTimeConsume, endTime should be an Number, now is ${typeof endTime}`);
    }

    const now = new Date()
    const where = {
      createdAt: {
        [Op.gt]: beginTime ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
        [Op.lt]: endTime ? new Date(endTime) : now,
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
      limit: 500,
      order: [['id', 'DESC' ]]
    });
  }

  async getAbnormalNodes({type, beginTime, endTime})
  {
    assert(typeof type === 'number', `Mysql getAbnormalNodes, type should be an Number, now is ${typeof type}`);

    if(beginTime)
    {
      assert(typeof beginTime === 'number', `Mysql getAbnormalNodes, beginTime should be an Number, now is ${typeof beginTime}`);
    }
    if(endTime)
    {
      assert(typeof endTime === 'number', `Mysql getAbnormalNodes, endTime should be an Number, now is ${typeof endTime}`);
    }

    const now = new Date()
    const where = {
      createdAt: {
        [Op.gt]: beginTime ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
        [Op.lt]: endTime ? new Date(endTime) : now,
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
      limit: 500
    });
  }
}

module.exports = Mysql;