const mysql = require("mysql");
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