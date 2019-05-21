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
      return rawTransaction.data
    })

    for(let rawTransaction of rawTransactions)
    {
      await rawTransaction.destroy();
    }

    return result;
  }
}

module.exports = Mysql;