const Sequelize = require('sequelize');

module.exports = ['memory', {
  consume: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  indexes: [{
    unique: true,
    fields: ['consume']
  }],
  scopes: {
    
  }
}];
