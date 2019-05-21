const Sequelize = require('sequelize');

module.exports = ['account', {
  number: {
    type: Sequelize.STRING,
    allowNull: false
  },
  address: {
    type: Sequelize.STRING,
    allowNull: false
  },
  stateRoot: {
    type: Sequelize.STRING,
    allowNull: false
  },
  data: {
    type: Sequelize.TEXT,
    allowNull: false
  }
}, {
  indexes: [{
    unique: true,
    fields: ['number', 'address', 'stateRoot']
  }],
  scopes: {
    
  }
}];
