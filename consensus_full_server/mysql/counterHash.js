const Sequelize = require('sequelize');

module.exports = ['counterHash', {
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
