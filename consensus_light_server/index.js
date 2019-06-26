const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const { host, port } = require("./config.json");
const Mysql = require("./mysql");
const log4js= require("./logConfig");

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

  exit(1)
})

process[Symbol.for('app')] = app;

(async () => {
  // init mysql
  process[Symbol.for("mysql")].init()

  // init mongo
  process[Symbol.for("mongo")] = await require("./mongo")();

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

  // load module
  require('./block_chain');
  require('./consensus_state');

  // begin to listen
  const server = app.listen(port, host, function() {
      logger.info(`clientParse server listening at http://${host}:${port}`);
  });
})()




