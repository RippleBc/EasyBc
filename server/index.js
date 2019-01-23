const process = require("process")
const express = require("express");
const bodyParser = require("body-parser"); 
const Processor = require("./processor");
const log4js= require("./logConfig");
const logger = log4js.getLogger();
const errlogger = log4js.getLogger("err");
const othlogger = log4js.getLogger("oth");

const SUCCESS = 0;
const PARAM_ERR = 1;
const OTH_ERR = 1;

const TRANSACTION_STATE_UNCONSISTENT = 1
const TRANSACTION_STATE_CONSISTENT = 2
const TRANSACTION_STATE_PACKED = 3

const processor = new Processor();

process.on("uncaughtException", function (err) {
    errlogger.err(err.stack);

    //
    processor.reset();
});

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json({limit: "1mb"}));

log4js.useLogger(app, logger);

const server = app.listen(8080, function() {
    let host = server.address().address;
    let port = server.address().port;
    console.log("server listening at http://%s:%s", host, port);
});

//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", '3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
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
    })
    
})

app.post("/getAccountInfo", function(req, res) {
	if(!req.body.data) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need data"
        });
        return;
    }
    processor.getAccountIn
})


app.post("/getTransactionInfo", function(req, res) {
    if(!req.body.hash) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need data"
        });
        return;
    }
});