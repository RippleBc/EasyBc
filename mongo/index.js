const mongoose = require('mongoose');
const blockSchema = require("./block")
const trieNodeSchema = require("./trieNode")
const MptDB = require("../depends/merkle_patricia_tree/db")
const assert = require("assert");
const Block = require("../depends/block")
const TrieNodeDb = require("./trieNodeDb")
const BlockDb = require("./blockDb")

var mongooseInstance;
var mptDb;
var blockDb;

module.exports = {
  initBaseDb: async (host, port, user, password) => {
    assert(typeof host === 'string', `mongo initBaseDb, host should be a String, now is ${typeof host}`)
    assert(typeof port === 'number', `mongo initBaseDb, port should be a Number, now is ${typeof port}`)
    assert(typeof user === 'string', `mongo initBaseDb, user should be a String, now is ${typeof user}`)
    assert(typeof password === 'string', `mongo initBaseDb, password should be a String, now is ${typeof password}`)


    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);

    mongooseInstance = await mongoose.connect(`mongodb://${host}:${port}`, {
      dbName: "blockChain", 
      user: user,
      pass: password
    });
  },

  generateMptDb: () => {
    if(!mptDb)
    {
      let trieNodeDb = new TrieNodeDb(mongooseInstance);
      mptDb = new MptDB(trieNodeDb)
    }
    return mptDb
  },

  generateBlockDb: () => {
    if(!blockDb)
    {
      blockDb = new BlockDb(mongooseInstance);
    }
    return blockDb
  }

}