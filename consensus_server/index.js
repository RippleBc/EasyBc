const process = require("process");
const log4js= require("./logConfig");
const logger = log4js.getLogger();

process[Symbol.for("loggerP2p")] = log4js.getLogger("p2p");
process[Symbol.for("loggerNet")] = log4js.getLogger("net");
process[Symbol.for("loggerConsensus")] = log4js.getLogger("consensus");

const express = require("express");
const bodyParser = require("body-parser");
const assert = require("assert");
const utils = require("../depends/utils");
const P2p = require("./p2p");
const { http } = require("./config");

const {SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_UNPACKED, TRANSACTION_STATE_PACKED, TRANSACTION_STATE_NOT_EXISTS} = require("../constant");

const Buffer = utils.Buffer;
const toBuffer = utils.toBuffer;
const bufferToInt = utils.bufferToInt;

//
process.on("uncaughtException", function(err) {
    logger.error(err.stack);
    process.exit(1);
});

/************************************** consensus **************************************/
const Processor = require("./processor");
const processor = new Processor();
processor.run();

/************************************** p2p **************************************/
const p2p = process[Symbol.for("p2p")] = new P2p();
p2p.init(processor.handleMessages);

/************************************** http **************************************/
const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json({limit: "1mb"}));
const server = app.listen(http.port, http.host, function() {
    logger.info(`server listening at http://${http.host}:${http.port}`);
});
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", '3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
log4js.useLogger(app, logger);

app.post("/sendTransaction", function(req, res) {
    if(!req.body.tx) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need tx"
        });
        return;
    }

    processor.processTransaction(req.body.tx)
    .then(() => {
        res.send({
            code: SUCCESS,
            msg: ""
        });
    })
    .catch(e => {
        res.send({
            code: OTH_ERR,
            msg: err
        });
    })
});