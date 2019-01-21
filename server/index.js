const process = require("process")
const express = require("express");
const Processor = require("./processor");
const log4js= require("./logConfig");
const logger = log4js.getLogger();
const errlogger = log4js.getLogger("err");
const othlogger = log4js.getLogger("oth");

const PARAM_ERR = 1;

process.on("uncaughtException", function (err) {
    errlogger.err(err.stack);
});

const app = express();
log4js.useLogger(app, logger);

const server = app.listen(9090, function() {
    let host = server.address().address;
    let port = server.address().port;
    console.log("server listening at http://%s:%s", host, port);
});

const processor = new Processor();

//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.post("/transaction", function(req, res) {
    if (!req.query.data) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need data"
        });
        return;
    }
})

app.post("/account", function(req, res) {
	
})