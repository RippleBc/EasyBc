const Sequelize = require('sequelize');

module.exports = ['abnormalNode', {
  address: {
    type: Sequelize.STRING,
    allowNull: false
  },
  type: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  reason: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  indexes: [],
  scopes: {
    
  }
}];
