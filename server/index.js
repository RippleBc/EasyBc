const process = require("process")
const express = require("express");
const bodyParser = require("body-parser") 
const Processor = require("./processor")
const util = require("../utils")
const {SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_UNPACKED, TRANSACTION_STATE_PACKED, TRANSACTION_STATE_NOT_EXISTS} = require("../const")

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
const server = app.listen(8080, function() {
    let host = server.address().address;
    let port = server.address().port;
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


// consensus
const processor = new Processor(app);
processor.run();
process.on("uncaughtException", function (err) {
    errlogger.error(err.stack);

    // //
    // processor.run();
    process.exit(1);
});

// logger
log4js.useLogger(app, logger);

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

app.post("/getAccountInfo", function(req, res) {
	if(!req.body.address) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need address"
        });
        return;
    }
    processor.blockChain.stateManager.getAccount(req.body.address, function(err, account) {
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
            msg: "",
            data: account.serialize().toString("hex")
        });
    });
});


app.post("/getTransactionState", function(req, res) {
    if(!req.body.hash) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need data"
        });
        return;
    }

    if(processor.transactionsPool.ifExist(req.body.hash))
    {
        res.send({
            code: SUCCESS,
            msg: "",
            data: TRANSACTION_STATE_UNPACKED
        });
        return;
    }

    processor.blockChain.getTrasaction(req.body.hash, function(err, transaction) {
        if(!!err)
        {
            res.send({
                code: OTH_ERR,
                msg: err
            });
            return;
        }
        if(!transaction)
        {
            res.send({
                code: SUCCESS,
                msg: "",
                data: TRANSACTION_STATE_NOT_EXISTS
            });
            return;
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
        res.send({
            code: PARAM_ERR,
            msg: "param error, need number"
        });
        return;
    }

    processor.blockChain.getBlockByNumber(req.body.number, (err, block) => {
        if(!!err)
        {
            res.send({
                code: OTH_ERR,
                msg: "getBlockByNumber error, inner err " + err
            });
            return;
        }

        if(block === null)
        {
            res.send({
                code: OTH_ERR,
                msg: "getBlockByNumber error, on corresponding block"
            });
            return;
        }

        res.send({
            code: SUCCESS,
            msg: "",
            data: util.baToHexString(block.serialize())
        });
    })
});