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
  nonce: {
    type: Sequelize.STRING,
    allowNull: false
  },
  timestamp: {
    type: Sequelize.DATE,
    allowNull: false
  },
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
  },
  data: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  rawData: {
    type: Sequelize.TEXT,
    allowNull: false
  }
}, {
  indexes: [{
    unique: true,
    fields: ['hash']
  }, {
    fields: ['from']
  }, {
    fields: ['to']
  }],
  scopes: {
    
  }
}];