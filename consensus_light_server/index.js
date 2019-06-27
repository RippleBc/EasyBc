const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const { host, port } = require("./config.json");
const Mysql = require("./mysql");
const log4js= require("./logConfig");
const Trie = require("../depends/merkle_patricia_tree");
const mongoConfig = require("./config").mongo;

const logger = log4js.getLogger();
process[Symbol.for("errLogger")] = log4js.getLogger("err");
process[Symbol.for("mysql")] = new Mysql();

const printErrorStack = process[Symbol.for("printErrorStack")] = e => {
	const errLogger = process[Symbol.for('errLogger')];

  let err;

  if(e)
  {
      err = e
  } 
  else
  {
      try
      {
          throw new Error('call stack')
      }
      catch(e)
      {
          err = e;
      }
  }
  
  if(e.stack)
  {
    errLogger.error(err.stack);
  }
  else
  {
    errLogger.error(e.toString());
  }
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
  const mongo = require("../depends/mpt_db_wrapper");
  await mongo.initBaseDb(mongoConfig.host, mongoConfig.port, mongoConfig.user, mongoConfig.password);
  const trieDb = mongo.generateMptDb()
  process[Symbol.for("accountTrie")] = new Trie(trieDb);
  process[Symbol.for("blockDb")] = mongo.generateBlockDb();

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
  process[Symbol.for('app')] = app;

  // load module
  require('./block_chain');
  require('./consensus_state');

  // begin to listen
  const server = app.listen(port, host, function() {
      logger.info(`clientParse server listening at http://${host}:${port}`);
  });
})()




