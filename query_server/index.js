const process = require("process");
const express = require("express");
const bodyParser = require("body-parser");
const utils = require("../depends/utils");
const Cache = require("./cache");
const { SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_PACKED, TRANSACTION_STATE_NOT_EXISTS } = require("../constant");
const { host, port } = require("./config.json");

const log4js= require("./logConfig");
const logger = log4js.getLogger();

process[Symbol.for("loggerErr")] = log4js.getLogger("err");
process[Symbol.for("loggerOth")] = log4js.getLogger("oth");

const Buffer = utils.Buffer;

// express
const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json({limit: "1mb"}));
const server = app.listen(port, host, function() {
    logger.info(`server listening at http://${host}:${port}`);
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

//
const cache = new Cache();
app.post("/getAccountInfo", function(req, res) {
	if(!req.body.address) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need address"
        });
    }
    cache.getAccount(req.body.address).then(account => {
        if(account)
        {
            res.send({
                code: SUCCESS,
                msg: "",
                data: account.serialize().toString("hex")
            });
        }
        else
        {
            res.send({
                code: SUCCESS,
                msg: ""
            });
        }
    });
});


app.post("/getTransactionState", function(req, res) {
    if(!req.body.hash) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need data"
        });
    }

    cache.getTrasaction(req.body.hash).then(transaction => {
        if(!transaction)
        {
            return res.send({
                code: SUCCESS,
                msg: "",
                data: TRANSACTION_STATE_NOT_EXISTS
            });
        }

        res.send({
            code: SUCCESS,
            msg: "",
            data: TRANSACTION_STATE_PACKED
        });
    });
});

app.post("/getBlockByNumber", function(req, res) {
    if(!req.body.number) {
        return res.send({
            code: PARAM_ERR,
            msg: "getBlockByNumber, param error, need number"
        });
    }

    cache.getBlockByNumber(req.body.number).then(block => {
        if(block)
        {
            return res.send({
                code: SUCCESS,
                msg: "",
                data: block.serialize().toString("hex")
            });
        }
       
        return res.send({
            code: OTH_ERR,
            msg: `getBlockByNumber, block not exist, number ${req.body.number}`
        });
    });
});

app.post("/getLastestBlock", function(req, res) {
    cache.getLastestBlock().then(block => {
        if(block)
        {
            return res.send({
                code: SUCCESS,
                msg: "",
                data: block.serialize().toString("hex")
            });
        }
        else
        {
            return res.send({
                code: SUCCESS,
                msg: ""
            });
        }
        
    });
});