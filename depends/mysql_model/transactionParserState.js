const Sequelize = require('sequelize');

module.exports = ['transactionParserState', {
  blockNumber: {
    type: Sequelize.STRING,
    allowNull: false
  }
}];
