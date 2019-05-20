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
const logModelConfig = require('./log');
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
   * @param {Block} block
   */
  async saveBlock(block)
  {
    assert(block instanceof Block, `Mysql saveBlock, block should be an Block Object, now is ${typeof block}`);

    await this.Block.create({
      number: block.header.number.toString('hex'),
      hash: block.hash().toString('hex'),
      data: block.serialize().toString('hex')
    })
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
   * @param {Buffer} number
   * @param {Buffer} stateRoot
   * @param {Buffer} address
   * @param {Buffer} account
   */
  async saveAccount(number, stateRoot, address, account)
  {
    assert(Buffer.isBuffer(number), `Mysql saveAccount, number should be an Buffer, now is ${typeof number}`);
    assert(Buffer.isBuffer(stateRoot), `Mysql saveAccount, stateRoot should be an Buffer, now is ${typeof stateRoot}`);
    assert(Buffer.isBuffer(address), `Mysql saveAccount, address should be an Buffer, now is ${typeof address}`);
    assert(Buffer.isBuffer(account), `Mysql saveAccount, account should be an Buffer, now is ${typeof account}`);

    await this.Account.create({
      number: number.toString('hex'),
      address: address.toString('hex'),
      stateRoot: stateRoot.toString('hex'),
      data: account.toString('hex')
    })
  }

  /**
   * @param {Buffer} number
   * @param {Buffer} stateRoot
   * @param {Array} accounts
   */
  async saveAccounts(number, stateRoot, accounts)
  {
    assert(Buffer.isBuffer(number), `Mysql saveAccounts, number should be an Buffer, now is ${typeof number}`);
    assert(Buffer.isBuffer(stateRoot), `Mysql saveAccounts, stateRoot should be an Buffer, now is ${typeof stateRoot}`);
    assert(Array.isArray(accounts), `Mysql saveAccounts, accounts should be an Array, now is ${typeof accounts}`);

    for(let i = 0; i < accounts.length; i += 2)
    {
      await this.saveAccount(number, stateRoot, accounts[i], accounts[i + 1]);
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
   * @param {Array} logs
   */
  async saveLogs(logs)
  {
    assert(Array.isArray(logs), `Mysql saveLogs, logs should be an Array, now is ${typeof logs}`);

    for(let log of logs)
    {
      try
      {
        await this.Log.create({...log});
      }
      catch(e)
      {
        await Promise.reject(`time: ${log.time}, type: ${log.type}, title: ${log.title}, data: ${log.data}, ${e}`)
      }
    }
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
      limit: 100,
      order: [['id', 'DESC' ]]
    });
  }
}

module.exports = Mysql;