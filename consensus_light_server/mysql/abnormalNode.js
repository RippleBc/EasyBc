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
  weight: {
    type: Sequelize.NUMBER,
    allowNull: false
  }
}, {
  indexes: [],
  scopes: {
    
  }
}];
