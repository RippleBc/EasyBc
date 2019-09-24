const Sequelize = require('sequelize');

module.exports = ['tokenDistribution', {
  address: {
    type: Sequelize.STRING,
    allowNull: false
  },
  balance: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
    indexes: [{
      unique: true,
      fields: ['address']
    }],
    scopes: {

    }
  }];
