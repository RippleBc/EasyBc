const mysqlConfig = require("../config.json").mysql;
const transactionModelConfig = require('../../depends/mysql_model/transaction');
const rawTransactionModelConfig = require('../../depends/mysql_model/rawTransaction');
const logModelConfig = require('../../depends/mysql_model/log');
const timeConsumeModelConfig = require('../../depends/mysql_model/timeConsume');
const abnormalNodeModelConfig = require('../../depends/mysql_model/abnormalNode');
const sideChainModelConfig = require('../../depends/mysql_model/sideChain');
const receivedSpvModelConfig = require('../../depends/mysql_model/receivedSpv');
const sideChainConstractModelConfig = require('../../depends/mysql_model/sideChainConstract');
const waitingCrossPayModelConfig = require('../../depends/mysql_model/waitingCrossPay');
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
    this.Log = this.sequelize.define(...logModelConfig);
    this.RawTransaction = this.sequelize.define(...rawTransactionModelConfig);
    this.TimeConsume = this.sequelize.define(...timeConsumeModelConfig);
    this.AbnormalNode = this.sequelize.define(...abnormalNodeModelConfig);
    this.SideChain = this.sequelize.define(...sideChainModelConfig)
    this.ReceivedSpv = this.sequelize.define(...receivedSpvModelConfig);
    this.SideChainConstract = this.sequelize.define(...sideChainConstractModelConfig);
    this.WaitingCrossPay = this.sequelize.define(...waitingCrossPayModelConfig);
    this.CrossPay = this.sequelize.define(...crossPayModelConfig);
    this.CrossPayRequest = this.sequelize.define(...crossPayRequestModelConfig);
    this.MultiSignPay = this.sequelize.define(...multiSignPayModelConfig);
    this.MultiSignPayRequest = this.sequelize.define(...multiSignPayRequestModelConfig);

    await this.sequelize.authenticate();
    await this.sequelize.sync();
  }
}

module.exports = Mysql;