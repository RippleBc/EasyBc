const mongoose = require('mongoose');

const Schema = mongoose.Schema;

module.exports = new Schema({
  number: { 
  	type: String, 
  	required: true,
  	index: true 
  },
  hash: { 
  	type: String, 
  	required: true,
  	index: true 
  },
  data: { 
  	type: String,
  	required: true
  }
});