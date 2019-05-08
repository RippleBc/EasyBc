const Sequelize = require('sequelize');

module.exports = ['transaction', {
  hash: {
    type: Sequelize.STRING,
    allowNull: false
  },
  number: {
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
    fields: ['hash']
  }],
  scopes: {
    
  }
}];
