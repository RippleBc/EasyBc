const express = require("express")
const path = require("path")
const db = require("./backend/db")
const {SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_UNCONSISTENT, TRANSACTION_STATE_CONSISTENT, TRANSACTION_STATE_PACKED, TRANSACTION_STATE_NOT_EXISTS} = require("../const")
const {getTransactionState, getAccountInfo, getLastestBlock} = require("./backend/chat")
const util = require("../utils")

const log4js= require("./logConfig")
const logger = log4js.getLogger()
const errlogger = log4js.getLogger("err")
const othlogger = log4js.getLogger("oth")

const Buffer = util.Buffer;
const BN = util.BN;

const app = express();
log4js.useLogger(app, logger);
app.use("/", express.static(path.join(__dirname + "/dist")));

const server = app.listen(9090, function() {
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

app.get("/getPrivateKey", function(req, res) {
  db.getPrivateKey(req.query.address, function(err, value) {
    res.send({
        code: !!err ? OTH_ERR : SUCCESS,
        msg: err,
        data: value
    });
  });
})

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
  if(!req.query.url) {
    res.send({
        code: PARAM_ERR,
        msg: "param error, need url"
    });
    return;
  }

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

  let from = Buffer.from(req.query.from, "hex");
  let to = Buffer.from(req.query.to, "hex");
  let bnValue = new BN(Buffer.from(req.query.value, "hex"));

  db.sendTransaction(req.query.url, from, to, bnValue, function(err, transactionHashHexString) {
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
      data: transactionHashHexString
    });
  });
});

app.get("/getTransactionState", function(req, res) {
  let returnData;

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

  getTransactionState(req.query.url, Buffer.from(req.query.hash, "hex"), function(err, transactionState) {
    if(!!err)
    {
      res.send({
        code: OTH_ERR,
        msg: err
      });
      return;
    }

    if(transactionState == TRANSACTION_STATE_UNCONSISTENT)
    {
      returnData = "transaction not consistent";
    }
    
    if(transactionState == TRANSACTION_STATE_CONSISTENT)
    {
      returnData = "transaction consistent";
    }

    if(transactionState == TRANSACTION_STATE_PACKED)
    {
      returnData = "transaction packed";
    }

    if(transactionState == TRANSACTION_STATE_NOT_EXISTS)
    {
      returnData = "transaction not exists";
    }

    res.send({
      code: SUCCESS,
      msg: "",
      data: returnData
    });
  })
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

  getAccountInfo(req.query.url, Buffer.from(req.query.address, "hex"), function(err, account) {
    if(!!err)
    {
      res.send({
        code: OTH_ERR,
        msg: err
      });
      return;
    }

    //
    let nonce = util.bufferToInt(account.nonce);
    let balance = util.bufferToInt(account.balance);

    //
    res.send({
      code: SUCCESS,
      msg: "",
      data: JSON.stringify({
        "nonce": nonce,
        "balance": balance
      })
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

  getLastestBlock(req.query.url, function(err, block) {
    if(!!err)
    {
      res.send({
        code: OTH_ERR,
        msg: err
      });
      return;
    }

    //
    let hash = util.baToHexString(block.hash())
    let number = util.baToHexString(block.header.number);
    let parentHash = util.baToHexString(block.header.parentHash);
    let stateRoot = util.baToHexString(block.header.stateRoot)
    let transactionsTrie = util.baToHexString(block.header.transactionsTrie)
    
    //
    res.send({
      code: SUCCESS,
      msg: "",
      data: JSON.stringify({
        "hash": hash,
        "number": number,
        "parentHash": parentHash,
        "stateRoot": stateRoot,
        "transactionsTrie": transactionsTrie
      })
    });
  });
});