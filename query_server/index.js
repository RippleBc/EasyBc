const process = require("process");
const express = require("express");
const bodyParser = require("body-parser");
const utils = require("../depends/utils");
const { host, port } = require("./config.json");

const log4js= require("./logConfig");
const logger = log4js.getLogger();

const Buffer = utils.Buffer;

// express
const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json({limit: "1mb"}));
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", '3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

// logger
log4js.useLogger(app, logger);

process[Symbol.for("loggerErr")] = log4js.getLogger("err");
process[Symbol.for("loggerOth")] = log4js.getLogger("oth");
process[Symbol.for("app")] = app;

require('./block_chain');
require('./resource');

//
const server = app.listen(port, host, function() {
    logger.info(`server listening at http://${host}:${port}`);
});
