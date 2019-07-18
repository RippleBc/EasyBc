const mongoose = require('mongoose');

const Schema = mongoose.Schema;

module.exports = new Schema({
	hash: {
		type: String,
		unique: true,
		required: true,
		index: true
	},
	data: {
		type: String,
		required: true
	}
});