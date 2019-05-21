const Sequelize = require('sequelize');

module.exports = ['block', {
  number: {
    type: Sequelize.STRING,
    allowNull: false
  },
  hash: {
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
    fields: ['number']
  }, {
    unique: true,
    fields: ['hash']
  }],
  scopes: {
    
  }
}];
