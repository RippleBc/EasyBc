const Sequelize = require('sequelize');

module.exports = ['transactionsHistory', {
  txHash: {
    type: Sequelize.STRING,
    allowNull: false
  },
  from: {
    type: Sequelize.STRING,
    allowNull: false
  },
  nonce: {
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
  }
}, {
  indexes: [{
    fields: ['from']
  }, {
    fields: ['to']
  }],
  scopes: {
    
  }
}];
