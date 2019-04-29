const Sequelize = require('sequelize');

module.exports = ['user', {
  username: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  privilege: {
    type: Sequelize.STRING,
    allowNull: false
  },
  remarks: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  indexes: [{
    unique: true,
    fields: ['username']
  }],
  scopes: {
    
  }
}];
