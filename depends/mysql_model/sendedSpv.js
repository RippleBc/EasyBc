const Sequelize = require('sequelize');

module.exports = ['sendedSpv', {
  hash: {
    type: Sequelize.STRING,
    allowNull: false
  },
  number: {
    type: Sequelize.STRING,
    allowNull: false
  },
  chainCode: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
    indexes: [{
      unique: true,
      fields: ['hash']
    }],
    scopes: {

    }
  }];
