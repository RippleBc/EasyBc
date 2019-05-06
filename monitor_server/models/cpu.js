const Sequelize = require('sequelize');

module.exports = ['cpu', {
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
