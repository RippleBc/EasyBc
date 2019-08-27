const mysqlConfig = require("../config.json").mysql;
const assert = require("assert");
const logModelConfig = require('../../depends/mysql_model/log');
const logParserStateModelConfig = require('../../depends/mysql_model/logParserState');
const Sequelize = require('sequelize');

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
    this.Log = this.sequelize.define(...logModelConfig);
    this.LogParserState = this.sequelize.define(...logParserStateModelConfig);
    
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
   * @param {String} dir
   */
  async getLogParserState (dir) {
    assert(typeof dir === 'string', `Mysql getLogParserState, dir should be an String, now is ${typeof dir}`);

    const [logParserState, ] = await this.LogParserState.findOrCreate({
      where: {
        dir: dir
      },
      defaults: {
        logFile: '',
        offset: 0
      }
    });

    return logParserState;
  }

  /**
   * @param {String} dir
   * @param {String} logFile
   */
  async saveLogFile (dir, logFile) {
    assert(typeof dir === 'string', `Mysql saveLogFile, dir should be an String, now is ${typeof dir}`);
    assert(typeof logFile === 'string', `Mysql saveLogFile, logFile should be an String, now is ${typeof logFile}`);

    await this.LogParserState.update({
      dir: dir
    }, {
      logFile: logFile
    })
  }

  /**
   * @param {String} dir
   * @param {Number} offset
   */
  async saveOffset (dir, offset) {
    assert(typeof dir === 'string', `Mysql saveOffset, dir should be an String, now is ${typeof dir}`);
    assert(typeof offset === 'number', `Mysql saveOffset, offset should be an Number, now is ${typeof offset}`);

    await this.LogParserState.update({
      dir: dir
    }, {
      offset: offset
    })
  }
}

module.exports = Mysql;