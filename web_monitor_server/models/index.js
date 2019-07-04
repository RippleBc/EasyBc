const mysqlConfig = require("../config.json").mysql;
const Sequelize = require('sequelize');
const userModelConfig = require('./user');
const nodeModelConfig = require('./node');

const logger = process[Symbol.for('dbLogger')] || console

class Model
{
  constructor()
  {
    this.sequelize = new Sequelize('monitor', mysqlConfig.user, mysqlConfig.password, {
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  }

  async init()
  {
    this.User = this.sequelize.define(...userModelConfig);
    this.Node = this.sequelize.define(...nodeModelConfig);

    await this.sequelize.authenticate();
    await this.sequelize.sync();

    const [user, created] = await this.User.findOrCreate({
      where: {
        username: 'admin'
      },
      defaults: {
        password: 'admin',
        privilege: 'admin',
        remarks: 'this is the super user, please modify the password, immediately'
      }
    });

    if(created)
    {
      logger.info(`user ${user.username} created`);
    }
  }
}

module.exports = Model