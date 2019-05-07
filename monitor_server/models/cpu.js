const Sequelize = require('sequelize');

module.exports = ['cpu', {
  address: {
    type: Sequelize.STRING,
    allowNull: false
  },
  consume: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  indexes: [],
  scopes: {
    
  }
}];
