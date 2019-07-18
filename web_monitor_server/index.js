const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const passport = require('passport')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { host, port } = require('./config.json')
const Models = require('./models');

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

const log4js = require('./logConfig')
const logger = process[Symbol.for('logger')] = log4js.getLogger()
const errLogger = process[Symbol.for('errLogger')] = log4js.getLogger("err");
const dbLogger = process[Symbol.for('dbLogger')] = log4js.getLogger('db');
const models = process[Symbol.for('models')] = new Models();
process[Symbol.for('cookieSet')] = new Set();

(async () => {
	await models.init();

	// express
	const app = express()

	// set app global
	process[Symbol.for('app')] = app;

	app.use(cookieParser())
	app.use(bodyParser.urlencoded({
	  extended: true
	}))
	app.use(bodyParser.json({ limit: '20mb' }))
	app.use(passport.initialize())
	app.use(cors({
	  credentials: true, 
	  origin: 'http://localhost:7999', // web前端服务器地址
	}));
	app.use("/", express.static(path.join(__dirname + "/dist")));

	// logger
	log4js.useLogger(app, logger)

	process.on('uncaughtException', err => {
	  printErrorStack(err);

	  process.exit(1)
	})

	const server = app.listen(port, host, function() {
	    logger.info(`server listening at http://${host}:${port}`);
	});

	// begin to load module
	require('./user');
	logger.info('load user module success')
	
	require('./block');
	logger.info('load block module success')
	
	require('./monitor_nodes');
	logger.info('load monitor_nodes module success')

	require('./config_nodes');
	logger.info('load config_nodes module success')
})().then(() => {
	logger.info("server init success")
}).catch(e => {
  printErrorStack(e);

  process.exit(1)
});