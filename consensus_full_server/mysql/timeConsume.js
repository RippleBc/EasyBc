const Sequelize = require('sequelize');

module.exports = ['timeConsume', {
  stage: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  type: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  data: {
    type: Sequelize.BIGINT,
    allowNull: false
  }
}, {
  indexes: [],
  scopes: {
    
  }
}];
