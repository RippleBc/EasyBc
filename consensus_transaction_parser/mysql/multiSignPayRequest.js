const Sequelize = require('sequelize');

module.exports = ['multiSignPayRequest', {
  address: {
    type: Sequelize.STRING,
    allowNull: false
  },
  txHash: {
    type: Sequelize.STRING,
    allowNull: false
  },
  action: {
    type: Sequelize.STRING,
    allowNull: false
  },
  timestamp: {
    type: Sequelize.STRING,
    allowNull: false
  },
  to: {
    type: Sequelize.STRING,
    allowNull: false
  },
  value: {
    type: Sequelize.STRING,
    allowNull: false
  },
  sponsor: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
    indexes: [{
      unique: true,
      fields: ['txHash']
    }],
    scopes: {

    }
  }];
