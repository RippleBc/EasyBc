const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// state 0表示正常 1表示因为断线被剔除 2表示因为作弊被剔除
module.exports = new Schema({
    address: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    host: {
        type: String,
        required: true,
        index: true
    },
    queryPort: {
        type: Number,
        required: true
    },
    p2pPort: {
        type: Number,
        required: true
    },
    state: {
        type: Number,
        required: true
    }
});