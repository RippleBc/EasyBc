const Sequelize = require('sequelize');

module.exports = ['sideChainAppendGuarantee', {
  code: {
    type: Sequelize.STRING,
    allowNull: false
  },
  txHash: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
    indexes: [{
      unique: true,
      fields: ['txHash']
    }],
    scopes: {

    }
  }];
