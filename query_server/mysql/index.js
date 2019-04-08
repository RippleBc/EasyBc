const mysql = require("mysql");
const mysqlConfig = require("../config.json").mysql;
const Account = require("../../depends/account");
const Block = require("../../depends/block");
const Transaction = require("../../depends/transaction");
const utils = require("../../depends/utils");
const assert = require("assert");

const Buffer = utils.Buffer;

class Mysql
{
  constructor()
  {
    this.pool  = mysql.createPool({
      connectionLimit: 10,
      host: mysqlConfig.host,
      user: mysqlConfig.user,
      password: mysqlConfig.password,
      port: mysqlConfig.port,
      database: "easy_bc"
    });
  }

  async getBlockChainHeight()
  {
    const promise = new Promise((resolve, reject) => {
      this.pool.query("SELECT number FROM block ORDER BY number DESC LIMIT 1", (err, results) => {
        if(!!err)
        {
          return reject(`Mysql saveBlock throw exception, ${err}`);
        }
        
        if(results.length === 0)
        {
          return resolve();
        }

        resolve(results[0].number);
      });
    });
    
    return promise;
  }

  /**
   * @param {Buffer} number
   */
  async getBlockByNumber(number)
  {
    assert(typeof number === "string", `Mysql getBlockByNumber, number should be an Buffer, now is ${typeof number}`);

    const promise = new Promise((resolve, reject) => {
      this.pool.query(`SELECT data FROM block WHERE number='${number.toString("hex")}'`, (err, results) => {
        if(!!err)
        {
          return reject(`Mysql saveBlock throw exception, ${err}`);
        }
        
        if(results.length === 0)
        {
          return resolve();
        }

        resolve(new Block(`0x${results[0].data}`));
      });
    });
    
    return promise;
  }

  /**
   * @param number {String}
   * @param stateTrie {String}
   * @param address {String}
   */
  async getAccount(number, stateTrie, address)
  {
    assert(typeof number === "string", `Mysql getAccount, number should be a String, now is ${typeof number}`);
    assert(typeof stateTrie === "string", `Mysql getAccount, stateTrie should be a String, now is ${typeof stateTrie}`);
    assert(typeof address === "string", `Mysql getAccount, address should be a String, now is ${typeof address}`);

    const promise = new Promise((resolve, reject) => {
      this.pool.query(`SELECT data FROM account WHERE stateTrie='${stateTrie}' OR number<'${number}' LIMIT 1`, (err, results) => {
        if(!!err)
        {
          return reject(`Mysql getAccount throw exception, ${err}`);
        }
        
        if(results.length === 0)
        {
          return resolve();
        }

        resolve(new Account(`0x${results[0].data}`));
      });
    });
    
    return promise;
  }

  /**
   * @param {String} hash
   */
  async getTransaction(hash)
  {
    assert(typeof hash === "string", `Mysql getTransaction, hash should be a String, now is ${typeof hash}`);

    const promise = new Promise((resolve, reject) => {
      this.pool.query(`SELECT data FROM transaction WHERE hash='${hash}'`, (err, results) => {
        if(!!err)
        {
          return reject(`Mysql getTransaction throw exception, ${err}`);
        }
        
        if(results.length === 0)
        {
          return resolve();
        }

        resolve(new Transaction(`0x${results[0].data}`));
      });
    });
    
    return promise;
  }
}

module.exports = Mysql;
