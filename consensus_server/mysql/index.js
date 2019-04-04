const mysql = require("mysql");
const { mysqlConfig } = require("../config.json");
const Account = require("../../depends/Account");
const Block = require("../../depends/Block");
const Transaction = require("../../depends/Transaction");
const utils = require("../../depends/utils");

const Buffer = utils.Buffer;

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
   * @param {Buffer} number
   * @param {Transaction} transaction
   */
  async getBlockHashByNumber(number)
  {
    assert(Buffer.isBuffer(number), `Mysql getBlockHashByNumber, number should be an Buffer, now is ${typeof number}`);

    const promise = new Promise((resolve, reject) => {
      this.pool.query(`SELECT hash FROM block WHERE number='${number.toString("hex")}'`, (err, results) => {
        if(!!err)
        {
          reject(`Mysql saveBlock throw exception, ${err}`);
        }
        
        if(results.length === 0)
        {
          resolve();
        }

        resolve(Buffer.from(results[0].hash, "hex"));
      });
    });
    
    return promise;
  }

  async getBlockChainHeight()
  {
    const promise = new Promise((resolve, reject) => {
      this.pool.query("SELECT number FROM block ORDER BY number DESC LIMIT 1", (err, results) => {
        if(!!err)
        {
          reject(`Mysql saveBlock throw exception, ${err}`);
        }
        
        if(results.length === 0)
        {
          resolve();
        }

        resolve(Buffer.from(results[0].number), "hex");
      });
    });
    
    return promise;
  }

  /**
   * @param {Buffer} number
   */
  async saveBlockChainHeight(number)
  {
    assert(Buffer.isBuffer(number), `Mysql saveBlockChainHeight, number should be an Buffer, now is ${typeof number}`);


  }

  /**
   * @param {Buffer} number
   */
  async getBlockByNumber(number)
  {
    assert(Buffer.isBuffer(number), `Mysql getBlockByNumber, number should be an Buffer, now is ${typeof number}`);

    const promise = new Promise((resolve, reject) => {
      this.pool.query(`SELECT data FROM block WHERE number='${number.toString("hex")}'`, (err, results) => {
        if(!!err)
        {
          reject(`Mysql saveBlock throw exception, ${err}`);
        }
        
        if(results.length === 0)
        {
          resolve();
        }

        resolve(new Block(`0x${results[0].data}`));
      });
    });
    
    return promise;
  }

  /**
   * @param {Block} block
   */
  async saveBlock(block)
  {
    assert(block instanceof Block, `Mysql saveBlock, block should be an Block Object, now is ${typeof block}`);

    const promise = new Promise((resolve, reject) => {
      this.pool.query(`INSERT IGNORE INTO block(number, hash, data) VALUES('${block.header.number.toString("hex")}', '${block.hash().toString("hex")}', '${block.serialize().toString("hex")}'')`, err => {
        if(!!err)
        {
          reject(`Mysql saveBlock throw exception, ${err}`);
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
  async saveAccount(address, account)
  {
    assert(Buffer.isBuffer(address), `Mysql saveAccount, address should be an Buffer, now is ${typeof address}`);
    assert(account instanceof Account, `Mysql saveAccount, account should be an Block Object, now is ${typeof account}`);

    const promise = new Promise((resolve, reject) => {
      this.pool.query(`INSERT IGNORE INTO account(address, data) VALUES('${address.toString("hex")}', '${account.serialize().toString("hex")}'')`, err => {
        if(!!err)
        {
          reject(`Mysql saveAccount throw exception, ${err}`);
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
  async saveTransaction(number, transaction)
  {
    assert(Buffer.isBuffer(number), `Mysql saveTransaction, number should be an Buffer, now is ${typeof number}`);
    assert(transaction instanceof Transaction, `Mysql saveTransaction, transaction should be an Block Object, now is ${typeof transaction}`);

    const promise = new Promise((resolve, reject) => {
      this.pool.query(`INSERT IGNORE INTO transaction(hash, number, data) VALUES('${transaction.hash().toString("hex")}', '${number.toString("hex")}', '${transaction.serialize().toString("hex")}'')`, err => {
        if(!!err)
        {
          reject(`Mysql saveTransaction throw exception, ${err}`);
        }
        
        resolve();
      });
    });
    
    return promise;
  }
}


