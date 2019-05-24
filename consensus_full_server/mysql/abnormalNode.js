const Sequelize = require('sequelize');

module.exports = ['abnormalNode', {
  address: {
    type: Sequelize.STRING,
    allowNull: false
  },
  type: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
}, {
  indexes: [],
  scopes: {
    
  }
}];
