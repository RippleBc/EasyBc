const Sequelize = require('sequelize');

module.exports = ['sideChain', {
  code: {
    type: Sequelize.STRING,
    allowNull: false
  },
  url: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
    indexes: [{
      unique: true,
      fields: ['code', 'url']
    }],
    scopes: {

    }
  }];
