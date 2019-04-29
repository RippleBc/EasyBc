const Sequelize = require('sequelize');

module.exports = ['node', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  host: {
    type: Sequelize.STRING,
    allowNull: false
  },
  port: {
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
    fields: ['name']
  }, {
    unique: true,
    fields: ['host', 'port']
  }],
  scopes: {
    
  }
}];
