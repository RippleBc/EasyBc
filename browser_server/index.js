const express = require("express");
const path = require("path");
const { port, host } = require("./config.json");
const cors = require("cors");

const log4js= require("./logConfig");
const logger = log4js.getLogger();

const printErrorStack = function(e) {
  const errLogger = log4js.getLogger("err");

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

process[Symbol.for("printErrorStack")] = printErrorStack;

(async () => {
  const app = express();
  app.use(cors({
    credentials: true, 
    origin: 'http://localhost:7997', // web前端服务器地址
  }));
  app.use("/", express.static(path.join(__dirname + "/dist")));
  log4js.useLogger(app, logger);

  process[Symbol.for("app")] = app;

  process.on('uncaughtException', err => {
    printErrorStack(err);
    
    process.exit(1)
  })
  
  const server = app.listen(port, host, function() {
      logger.info(`server listening at http://${host}:${port}`);
  });
})().then(() => {
  logger.info("server init ok")
}).catch(e => {
  printErrorStack(e);

  process.exit(1)
})