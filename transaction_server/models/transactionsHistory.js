const Sequelize = require('sequelize');

module.exports = ['transactionsHistory', {
  from: {
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
