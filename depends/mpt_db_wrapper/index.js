const mongoose = require('mongoose');
const assert = require("assert");
const MptDB = require("../merkle_patricia_tree/db")
const TrieNodeDb = require("./trieNodeDb")
const BlockDb = require("./blockDb")
const UnlDb = require("./unlDb")

var mongooseInstance;
var mptDb;
var blockDb;
var unlDb;

module.exports = {
  initBaseDb: async (host, port, user, password, dbName) => {
    assert(typeof host === 'string', `mongo initBaseDb, host should be a String, now is ${typeof host}`)
    assert(typeof port === 'number', `mongo initBaseDb, port should be a Number, now is ${typeof port}`)
    assert(typeof user === 'string', `mongo initBaseDb, user should be a String, now is ${typeof user}`)
    assert(typeof password === 'string', `mongo initBaseDb, password should be a String, now is ${typeof password}`)

    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);

    mongooseInstance = await mongoose.connect(`mongodb://${host}:${port}`, {
      dbName: dbName, 
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
  },

  generateUnlDb: () => {
    if(!unlDb)
    {
      unlDb = new UnlDb(mongooseInstance);
    }
    return unlDb
  }
}