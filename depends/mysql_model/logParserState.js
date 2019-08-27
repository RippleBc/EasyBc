const Sequelize = require('sequelize');

module.exports = ['logParserState', {
  dir: {
    type: Sequelize.STRING,
    allowNull: false
  },
  logFile: {
    type: Sequelize.STRING,
    allowNull: false
  },
  offset: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
}, {
    indexes: [{
      unique: true,
      fields: ['dir']
    }],
    scopes: {

    }
  }];
