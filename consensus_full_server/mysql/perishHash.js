const Sequelize = require('sequelize');

module.exports = ['perishHash', {
  hash: {
    type: Sequelize.STRING,
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
