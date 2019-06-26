const mysqlConfig = require("../config.json").mysql;
const assert = require("assert");
const logModelConfig = require('./log');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

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
    this.Log = this.sequelize.define(...logModelConfig);

    await this.sequelize.authenticate();
    await this.sequelize.sync();
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
}

module.exports = Mysql;