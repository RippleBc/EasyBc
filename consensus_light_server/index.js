const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const { host, port } = require("./config.json");
const Mysql = require("./mysql");
const Trie = require("../depends/merkle_patricia_tree");
const { mongo: mongoConfig } = require("./config");
const utils = require("../depends/utils");

const log4js = require("./logConfig");
const logger = log4js.getLogger();

process[Symbol.for("mysql")] = new Mysql();
process[Symbol.for("logger")] = logger;

const printErrorStack = process[Symbol.for("printErrorStack")] = e => {
  e = utils.getStackInfo(e);

  logger.error(e);
}

//
process.on('uncaughtException', err => {
  printErrorStack(err);

  process.exit(1);
});

(async () => {
  // init mysql
  process[Symbol.for("mysql")].init()

  // init mongo
  const mongo = require("../depends/mongo_wrapper");
  await mongo.initBaseDb(mongoConfig.host, mongoConfig.port, mongoConfig.user, mongoConfig.password, mongoConfig.dbName);
  const trieDb = mongo.generateMptDb()

  process[Symbol.for("accountTrie")] = new Trie(trieDb);
  process[Symbol.for("blockDb")] = mongo.generateBlockDb();
  process[Symbol.for("unlDb")] = mongo.generateUnlDb();

  // express
  const app = express();
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json({limit: "1mb"}));
  app.use(cors({
    credentials: true, 
    origin: 'http://localhost:8080'
  }));

  //
  process[Symbol.for('app')] = app;

  // load module
  require('./unl');
  require('./block_chain');
  require('./consensus_state');
  require('./cross_chain');
  require('./multi_sign');
  
  // begin to listen
  const server = app.listen(port, host, function() {
      logger.info(`clientParse server listening at http://${host}:${port}`);
  });
})()

console.log("process.pid: " + process.pid)