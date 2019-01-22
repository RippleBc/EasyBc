const express = require("express");
const path = require("path");
const db = require("./backend/db");
const log4js= require("./logConfig");
const logger = log4js.getLogger();
const errlogger = log4js.getLogger("err");
const othlogger = log4js.getLogger("oth");

const SUCCESS = 0;
const PARAM_ERR = 1;
const OTH_ERR = 2;

const app = express();
log4js.useLogger(app, logger);
app.use("/", express.static(path.join(__dirname + "/dist")));

const server = app.listen(8080, function() {
    let host = server.address().address;
    let port = server.address().port;
    console.log("server listening at http://%s:%s", host, port);
});

app.get("/generateKeyPiar", function(req, res) {
  db.generateKeyPiar(function(err, value) {
  	res.send({
        code: !!err ? OTH_ERR : SUCCESS,
        msg: err,
        data: value
    });
  });
});

app.get("/getFromHistory", function(req, res) {
  db.getFromHistory(function(err, value) {
  	res.send({
        code: !!err ? OTH_ERR : SUCCESS,
        msg: err,
        data: value
    });
  })
});

app.get("/getToHistory", function(req, res) {
  db.getToHistory(function(err, value) {
  	res.send({
        code: !!err ? OTH_ERR : SUCCESS,
        msg: err,
        data: value
    });
  });
});

app.get("/sendTransaction", function(req, res) {
	if(!req.query.from) {
    res.send({
        code: PARAM_ERR,
        msg: "param error, need from"
    });
    return;
  }

  if(!req.query.to) {
    res.send({
        code: PARAM_ERR,
        msg: "param error, need to"
    });
    return;
  }

  if(!req.query.value) {
    res.send({
        code: PARAM_ERR,
        msg: "param error, need value"
    });
    return;
  }

  db.sendTransaction(req.query, function(err, value) {
  	res.send({
        code: !!err ? OTH_ERR : SUCCESS,
        msg: err,
        data: value
    });
  });
});