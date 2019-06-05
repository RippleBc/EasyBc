const express = require("express");
const path = require("path");
const { SUCCESS, PARAM_ERR, OTH_ERR } = require("../constant");

const utils = require("../depends/utils");
const { port, host } = require("./config.json");
const cors = require("cors");
const Models = require("./models");

const log4js= require("./logConfig");
const logger = log4js.getLogger();
const errLogger = log4js.getLogger("err");

const Buffer = utils.Buffer;
const BN = utils.BN;

const printErrorStack = function(e) {
    let err;

    if(e)
    {
        err = e
    } 
    else
    {
        try
        {
            throw new Error('call stack')
        }
        catch(e)
        {
            err = e;
        }
    }
    
    if(e.stack)
    {
      errLogger.error(err.stack);
    }
    else
    {
      errLogger.error(e.toString());
    }
}

const models = process[Symbol.for("models")] = new Models();


(async () => {
  await models.init();

  const local = require("./local");
  const { getTransactionState, getAccountInfo, getLastestBlock, getTransactions } = require("./remote");

  const app = express();

  app.use(cors({
    credentials: true, 
    origin: 'http://localhost:8080', // web前端服务器地址
  }));
  app.use("/", express.static(path.join(__dirname + "/dist")));

  const server = app.listen(port, host, function() {
      logger.info(`server listening at http://${host}:${port}`);
  });

  log4js.useLogger(app, logger);

  app.get("/importAccount", function(req, res) {
    if(!req.query.privateKey) {
      return res.send({
          code: PARAM_ERR,
          msg: "param error, need privateKey"
      });
    }

    local.importAccount(req.query.privateKey).then(() => {
      res.send({
          code: SUCCESS
      });
    }).catch(e => {
      printErrorStack(e);

      res.send({
          code: OTH_ERR,
          msg: e.toString()
      });
    })
  });

  app.get("/generateKeyPiar", function(req, res) {
    local.generateKeyPiar().then(({address, privateKey}) => {
      res.send({
          code: SUCCESS,
          data: {
            address: address,
            privateKey: privateKey
          }
      });
    }).catch(e => {
      printErrorStack(e);

      res.send({
          code: OTH_ERR,
          msg: e.toString()
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

    local.getPrivateKey(req.query.address).then(privateKey => {
      res.send({
          code: SUCCESS,
          data: privateKey
      });
    }).catch(e => {
      printErrorStack(e);
      
      res.send({
          code: OTH_ERR,
          msg: e.toString()
      });
    });
  })

  app.get("/getAccounts", function(req, res) {
    if(!req.query.offset) {
      return res.send({
          code: PARAM_ERR,
          msg: "param error, need offset"
      });
    }

    local.getAccounts(req.query.offset).then(accounts => {
      res.send({
          code: SUCCESS,
          data: accounts
      });
    }).catch(e => {
      printErrorStack(e);
      
      res.send({
          code: OTH_ERR,
          msg: e.toString()
      });
    });
  });

  app.get("/getFromHistory", function(req, res) {
    if(!req.query.offset) {
      return res.send({
          code: PARAM_ERR,
          msg: "param error, need offset"
      });
    }

    local.getFromHistory(req.query.offset).then(fromHistory => {
      res.send({
          code: SUCCESS,
          data: fromHistory
      });
    }).catch(e => {
      printErrorStack(e);
      
      res.send({
          code: OTH_ERR,
          msg: e.toString()
      });
    });
  });

  app.get("/getToHistory", function(req, res) {
    if(!req.query.offset) {
      return res.send({
          code: PARAM_ERR,
          msg: "param error, need offset"
      });
    }

    local.getToHistory(req.query.offset).then(toHistory => {
      res.send({
          code: SUCCESS,
          data: toHistory
      });
    }).catch(e => {
      printErrorStack(e);
      
      res.send({
          code: OTH_ERR,
          msg: e.toString()
      });
    });
  });

  app.get("/sendTransaction", function(req, res) {
    if(!req.url) {
      return res.send({
          code: PARAM_ERR,
          msg: "param error, need url"
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

    local.sendTransaction(req.query.url, req.query.privateKey, req.query.from, req.query.to, req.query.value).then(transactionHash => {
      res.send({
          code: SUCCESS,
          data: transactionHash
      });
    }).catch(e => {
      printErrorStack(e);
      
      res.send({
          code: OTH_ERR,
          msg: e.toString()
      });
    })
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
    }).catch(e => {
      printErrorStack(e);
      
      res.send({
          code: OTH_ERR,
          msg: e.toString()
      });
    });
  });

  app.get("/getTransactions", function(req, res) {
    if(!req.query.url) {
      res.send({
          code: PARAM_ERR,
          msg: "param error, need url"
      });
      return;
    }

    getTransactions(req.query.url, req.query.hash, req.query.from, req.query.to, req.query.beginTime, req.query.endTime).then(transactions => {
      res.send({
          code: SUCCESS,
          data: transactions
      });
    }).catch(e => {
      printErrorStack(e);
      
      res.send({
          code: OTH_ERR,
          msg: e.toString()
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
    }).catch(e => {
      printErrorStack(e);
      
      res.send({
          code: OTH_ERR,
          msg: e.toString()
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
    }).catch(e => {
      printErrorStack(e);
      
      res.send({
          code: OTH_ERR,
          msg: e.toString()
      });
    });
  });
})().then(() => {
  logger.info("server init ok")
}).catch(e => {
  printErrorStack(`server init failed, ${e}, exit processor`);

  process.exit(1)
})