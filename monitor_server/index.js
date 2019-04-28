const process = require('process')
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const passport = require('passport')
const cookieParser = require('cookie-parser')
const { host, port } = require('./config.json')

const log4js = require('./logConfig')
const logger = log4js.getLogger()
const errlogger = log4js.getLogger('err')
const othlogger = log4js.getLogger('oth')

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

process[Symbol.for('cookieSet')] = new Set()
process[Symbol.for('app')] = app;

require('./user');

//
process.on('uncaughtException', function (err) {
  errlogger.error(err.stack)
})


const server = app.listen(port, host, function() {
    logger.info(`server listening at http://${host}:${port}`);
});
