const mysql = require("mysql");
const { mysqlConfig } = require("../config.json");
const Account = require("../../depends/Account");
const Block = require("../../depends/Block");
const Transaction = require("../../depends/Transaction");

class Mysql
{
  constructor()
  {
    this.pool  = mysqlConfig.createPool({
      connectionLimit: 10,
      host: mysqlConfig.host,
      user: mysqlConfig.user,
      password: mysqlConfig.password,
      port: mysqlConfig.port,
      database: "easy_bc"
    });
  }

  /**
   * @param {Block} block
   */
  async recordBlock(block)
  {
    assert(block instanceof Block, `Mysql recordBlock, block should be an Block Object, now is ${typeof block}`);

    const promise = new Promise((resolve, reject) => {
      this.pool.query(`INSERT IGNORE INTO block(number, hash, data) VALUES('${block.header.number.toString("hex")}', '${block.hash().toString("hex")}', '${block.serialize().toString("hex")}'')`, err => {
        if(!!err)
        {
          reject(`Mysql recordBlock throw exception, ${err}`);
        }
        
        resolve();
      });
    });
    
    return promise;
  }

  /**
   * @param {Buffer} address
   * @param {Account} account
   */
  async recordAccount(address, account)
  {
    assert(Buffer.isBuffer(address), `Mysql recordAccount, address should be an Buffer, now is ${typeof address}`);
    assert(account instanceof Account, `Mysql recordAccount, account should be an Block Object, now is ${typeof account}`);

    const promise = new Promise((resolve, reject) => {
      this.pool.query(`INSERT IGNORE INTO account(address, data) VALUES('${address.toString("hex")}', '${account.serialize().toString("hex")}'')`, err => {
        if(!!err)
        {
          reject(`Mysql recordAccount throw exception, ${err}`);
        }
        
        resolve();
      });
    });
    
    return promise;
  }

  /**
   * @param {Buffer} address
   */
  async deleteAccount(address)
  {
    assert(Buffer.isBuffer(address), `Mysql deleteAccount, address should be an Buffer, now is ${typeof address}`);

    const promise = new Promise((resolve, reject) => {
      this.pool.query(`DELETE FROM account WHERE address='${address.toString("hex")}'`, err => {
        if(!!err)
        {
          reject(`Mysql deleteAccount throw exception, ${err}`);
        }
        
        resolve();
      });
    });
    
    return promise;
  }

  /**
   * @param {Buffer} number
   * @param {Transaction} transaction
   */
  async recordTransaction(number, transaction)
  {
    assert(Buffer.isBuffer(number), `Mysql recordTransaction, number should be an Buffer, now is ${typeof number}`);
    assert(transaction instanceof Transaction, `Mysql recordTransaction, transaction should be an Block Object, now is ${typeof transaction}`);

    const promise = new Promise((resolve, reject) => {
      this.pool.query(`INSERT IGNORE INTO transaction(hash, number, data) VALUES('${transaction.hash().toString("hex")}', '${number.toString("hex")}', '${transaction.serialize().toString("hex")}'')`, err => {
        if(!!err)
        {
          reject(`Mysql recordTransaction throw exception, ${err}`);
        }
        
        resolve();
      });
    });
    
    return promise;
  }
}


