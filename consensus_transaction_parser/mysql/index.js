const mysqlConfig = require("../config.json").mysql;
const transactionModelConfig = require('../../depends/mysql_model/transaction');
const sendedSpvModelConfig = require('../../depends/mysql_model/sendedSpv');
const sideChainModelConfig = require('../../depends/mysql_model/sideChain');
const crossPayModelConfig = require('../../depends/mysql_model/crossPay');
const crossPayRequestModelConfig = require('../../depends/mysql_model/crossPayRequest');
const multiSignPayModelConfig = require('../../depends/mysql_model/multiSignPay');
const multiSignPayRequestModelConfig = require('../../depends/mysql_model/multiSignPayRequest');
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
    this.Transaction = this.sequelize.define(...transactionModelConfig);
    this.SendedSpv = this.sequelize.define(...sendedSpvModelConfig);
    this.SideChain = this.sequelize.define(...sideChainModelConfig);
    this.CrossPay = this.sequelize.define(...crossPayModelConfig);
    this.CrossPayRequest = this.sequelize.define(...crossPayRequestModelConfig);
    this.MultiSignPay = this.sequelize.define(...multiSignPayModelConfig);
    this.MultiSignPayRequest = this.sequelize.define(...multiSignPayRequestModelConfig);

    await this.sequelize.authenticate();
    await this.sequelize.sync();
  }
}

module.exports = Mysql;