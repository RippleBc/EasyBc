const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const passport = require('passport')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { host, port } = require('./config.json')
const Models = require('./models');

const log4js = require('./logConfig')
const logger = log4js.getLogger()
const dbLogger = log4js.getLogger('db')

const printErrorStack = process[Symbol.for("printErrorStack")] = function(e) {
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

const models = process[Symbol.for('models')] = new Models();

process[Symbol.for('logger')] = logger;
process[Symbol.for('dbLogger')] = dbLogger;
process[Symbol.for('cookieSet')] = new Set()
process[Symbol.for('app')] = app;

(async () => {
	await models.init();

	// express
	const app = express()
	app.use(cookieParser())
	app.use(bodyParser.urlencoded({
	  extended: true
	}))
	app.use(bodyParser.json({ limit: '20mb' }))
	app.use(passport.initialize())

	app.use(cors({
	  credentials: true, 
	  origin: 'http://localhost:8080', // web前端服务器地址
	}));
	app.use("/", express.static(path.join(__dirname + "/dist")));

	// logger
	log4js.useLogger(app, logger)

	process.on('uncaughtException', err => {
	  errlogger.error(err.stack)
	  exit(1)
	})

	const server = app.listen(port, host, function() {
	    logger.info(`server listening at http://${host}:${port}`);
	});

	// begin to load module
	logger.info('begin to user module')
	require('./user');

	logger.info('begin to block module')
	require('./block');

	logger.info('begin to unl module')
	require('./unl');
}).then(e => {
	logger.info("server init success")
}).catch(e => {
	errLogger.error("server init failed, exit processor")

  printErrorStack(e);

  process.exit(1)
});