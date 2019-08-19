const Sequelize = require('sequelize');

module.exports = ['sideChainConstract', {
  chainCode: {
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
      fields: ['chainCode']
    }],
    scopes: {

    }
  }];
