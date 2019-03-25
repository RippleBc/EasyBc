const process = require("process")
const express = require("express");
const bodyParser = require("body-parser") 
const Processor = require("./processor")
const util = require("../utils")
const {SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_UNPACKED, TRANSACTION_STATE_PACKED, TRANSACTION_STATE_NOT_EXISTS} = require("../const")
const {host, port} = require("./nodes")
const async = require("async")

const log4js= require("./logConfig")
const logger = log4js.getLogger()
const errlogger = log4js.getLogger("err")
const othlogger = log4js.getLogger("oth")

const Buffer = util.Buffer;

// express
const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json({limit: "1mb"}));
const server = app.listen(port, function() {
    let host = server.address().address;
    console.log("server listening at http://%s:%s", host, port);
});
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

// consensus
const processor = new Processor(app);
processor.run();
process.on("uncaughtException", function (err) {
    errlogger.error(err.stack);

    // const processor = new Processor(app);
    // processor.run();

    process.exit(1);
});

app.post("/sendTransaction", function(req, res) {
    if(!req.body.tx) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need tx"
        });
        return;
    }
    processor.processTransaction(req.body.tx, function(err) {
        if(!!err)
        {
            res.send({
                code: OTH_ERR,
                msg: err
            });
            return;
        }

        res.send({
            code: SUCCESS,
            msg: ""
        });
    });
});