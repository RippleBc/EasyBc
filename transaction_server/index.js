const express = require("express");
const path = require("path");
const db = require("./backend/db");
const { SUCCESS, PARAM_ERR, OTH_ERR } = require("../constant");
const { getTransactionState, getAccountInfo, getLastestBlock } = require("./backend/net");
const utils = require("../depends/utils");
const { port, host } = require("./config.json");

const log4js= require("./logConfig");
const logger = log4js.getLogger();
const errlogger = log4js.getLogger("err");
const othlogger = log4js.getLogger("oth");

const Buffer = utils.Buffer;
const BN = utils.BN;

const app = express();
log4js.useLogger(app, logger);
app.use("/", express.static(path.join(__dirname + "/dist")));

const server = app.listen(port, host, function() {
    logger.info(`server listening at http://${host}:${port}`);
});

app.get("/generateKeyPiar", function(req, res) {
  db.generateKeyPiar().then(() => {
    res.send({
        code: SUCCESS
    });
  });
});

app.get("/getPrivateKey", function(req, res) {
  if(!req.query.address) {
    return res.send({
        code: PARAM_ERR,
        msg: "param error, need address"
    });
  }

  db.getPrivateKey(req.query.address).then(privateKey => {
    res.send({
        code: SUCCESS,
        data: privateKey
    });
  });
})

app.get("/getFromHistory", function(req, res) {
  db.getFromHistory().then(fromHistory => {
    res.send({
        code: SUCCESS,
        data: fromHistory
    });
  });
});

app.get("/getToHistory", function(req, res) {
  db.getToHistory().then(toHistory => {
    res.send({
        code: SUCCESS,
        data: toHistory
    });
  });
});

app.get("/sendTransaction", function(req, res) {
  if(!req.query.queryUrl) {
    return res.send({
        code: PARAM_ERR,
        msg: "param error, need queryUrl"
    });
  }

  if(!req.query.consensusUrl) {
    return res.send({
        code: PARAM_ERR,
        msg: "param error, need consensusUrl"
    });
  }
  
	if(!req.query.from) {
    return res.send({
        code: PARAM_ERR,
        msg: "param error, need from"
    });
  }

  if(!req.query.to) {
    return res.send({
        code: PARAM_ERR,
        msg: "param error, need to"
    });
  }

  if(!req.query.value) {
    return res.send({
        code: PARAM_ERR,
        msg: "param error, need value"
    });
  }

  const from = Buffer.from(req.query.from, "hex");
  const to = Buffer.from(req.query.to, "hex");
  const value = Buffer.from(req.query.value, "hex");

  db.sendTransaction(req.query.queryUrl, req.query.consensusUrl, from, to, value).then(transactionHash => {
    res.send({
        code: SUCCESS,
        data: transactionHash
    });
  });
});

app.get("/getTransactionState", function(req, res) {
  if(!req.query.url) {
    res.send({
        code: PARAM_ERR,
        msg: "param error, need url"
    });
    return;
  }

  if(!req.query.hash) {
    res.send({
        code: PARAM_ERR,
        msg: "param error, need hash"
    });
    return;
  }

  getTransactionState(req.query.url, req.query.hash).then(state => {
    res.send({
        code: SUCCESS,
        data: state
    });
  });
});

app.get("/getAccountInfo", function(req, res) {
  if(!req.query.url) {
    res.send({
        code: PARAM_ERR,
        msg: "param error, need url"
    });
    return;
  }
  
  if(!req.query.address) {
    res.send({
        code: PARAM_ERR,
        msg: "param error, need address"
    });
    return;
  }

  getAccountInfo(req.query.url, req.query.address).then(account => {
    res.send({
        code: SUCCESS,
        data: {
          address: req.query.address.toString("hex"),
          nonce: account.nonce.toString("hex"),
          balance: account.balance.toString("hex")
        }
    });
  });
});

app.get("/getLastestBlock", function(req, res) {
  if(!req.query.url) {
    res.send({
        code: PARAM_ERR,
        msg: "param error, need url"
    });
    return;
  }

  getLastestBlock(req.query.url).then(block => {
    res.send({
        code: SUCCESS,
        data: {
          hash: block.hash().toString("hex"),
          number: block.header.number.toString("hex")
        }
    });
  });
});