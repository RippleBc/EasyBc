const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const passport = require('passport')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { host, port } = require('./config.json')
const Models = require('./models');
const utils = require("../depends/utils");
const log4js = require('./logConfig');
const leveldown = require('leveldown');

const logger = process[Symbol.for('logger')] = log4js.getLogger()
process[Symbol.for('errLogger')] = log4js.getLogger("err");
process[Symbol.for('dbLogger')] = log4js.getLogger('db');
process[Symbol.for("printErrorStack")] = e => {
	const errLogger = process[Symbol.for('errLogger')];

	e = utils.getStackInfo(e);

	errLogger.error(e);
}
const models = process[Symbol.for('models')] = new Models();
process[Symbol.for('cookieSet')] = new Set();
const levelDownInstance = process[Symbol.for('levelDownInstance')] = leveldown(path.join(__dirname, "./levelUpData"));

(async () => {
	await models.init();

	await new Promise((resolve, reject) => {
		levelDownInstance.open(e => {
			if(e)
			{
				reject(`open leveldown throw exception, ${e}`);
			}

			resolve();
		});
	});

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

	// check cookie
	const checkCookie = require('./user/checkCookie')
	app.use(checkCookie);

	// logger
	log4js.useLogger(app, logger)

	process.on('uncaughtException', err => {
	  process[Symbol.for("printErrorStack")](err);

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
  process[Symbol.for("printErrorStack")](e);

  process.exit(1)
});