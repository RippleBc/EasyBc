const Sequelize = require('sequelize');

module.exports = ['account', {
  privateKey: {
    type: Sequelize.STRING,
    allowNull: false
  },
  address: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  indexes: [{
    unique: true,
    fields: ['privateKey']
  }, {
    unique: true,
    fields: ['address']
  }],
  scopes: {
    
  }
}];
