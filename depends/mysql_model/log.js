const Sequelize = require('sequelize');

module.exports = ['log', {
  time: {
    type: Sequelize.STRING,
    allowNull: false
  },
  type: {
    type: Sequelize.STRING,
    allowNull: false
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  data: {
    type: Sequelize.TEXT,
    allowNull: false
  }
}, {

  indexes: [{
    fields: ['time']
  }, {
    fields: ['type']
  }, {
    fields: ['title']
  }],
  scopes: {
    
  }
}];
