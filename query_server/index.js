const process = require("process")
const express = require("express");
const bodyParser = require("body-parser") 
const Processor = require("./processor")
const util = require("../utils")
const { SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_UNPACKED, TRANSACTION_STATE_PACKED, TRANSACTION_STATE_NOT_EXISTS } = require("../constant");
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
                msg: "getBlockByNumber error, no corresponding block"
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

app.post("/getLastestBlock", function(req, res) {

    const EXIT_CODE = 1;

    let blockNumber, block;

    async.waterfall([
        function(cb) {
            processor.blockChain.getLastestBlockNumber((err, bnLastestBlockNumber) => {
                if(!!err)
                {
                    res.send({
                        code: OTH_ERR,
                        msg: "getLastestBlock getLastestBlockNumber error, inner err " + err
                    });
                    return cb(EXIT_CODE);
                }

                if(bnLastestBlockNumber.cmpn(0) === 0)
                {
                    res.send({
                        code: OTH_ERR,
                        msg: "getLastestBlock getLastestBlockNumber error, there is no block"
                    });
                    return cb(EXIT_CODE);
                }

                blockNumber = util.baToHexString(util.toBuffer(bnLastestBlockNumber));

                cb();
            })
        },

        function(cb) {
            processor.blockChain.getBlockByNumber(blockNumber, (err, _block) => {
                if(!!err)
                {
                    res.send({
                        code: OTH_ERR,
                        msg: "getLastestBlock getBlockByNumber error, inner err " + err
                    });
                    return cb(EXIT_CODE);
                }

                if(_block === null)
                {
                    res.send({
                        code: OTH_ERR,
                        msg: "getLastestBlock getBlockByNumber error, no corresponding block"
                    });
                    return cb(EXIT_CODE);
                }

                block = _block;
                
                cb();
            })
        }], err => {
            if(!!err)
            {
                return;
            }
  
            res.send({
                code: SUCCESS,
                msg: "",
                data: util.baToHexString(block.serialize())
            });
        });
});

/**
* get transaction
* @param {*} trasactionHash
*/
const getTrasaction = function(trasactionHash, cb)
{
  const TRANSACTION_FOUND = 1;
  
  trasactionHash = util.toBuffer(trasactionHash);
  let transaction;

  const self = this;

  self.getLastestBlockNumber(function(err, bnNumber) {
    if(!!err)
    {
      return cb(err);
    }

    getTransactionTraverse(bnNumber, cb);
  });

  /**
   * @param {Buffer} bnLastestBlockNumber
   * @return {Function} cb 
   */
  function getTransactionTraverse(bnLastestBlockNumber, cb)
  {
    let bnIndex = bnLastestBlockNumber;

    async.whilst(function() {
      return bnIndex.gtn(0);
    }, function(done) {
      getTransaction(bnIndex, function(err, _transaction) {
        bnIndex.isubn(1);

        if(!!err)
        {
          transaction = _transaction;
          return done(err);
        }

        done();
      });
    }, function(err) {
      if(!!err && err === TRANSACTION_FOUND)
      {
        return cb(null, transaction);
      }

      cb(err);
    });
  }

  /**
   * @param {*} blockNumber
   */
  function getTransaction(blockNumber, cb)
  {
    async.waterfall([
      function(cb) {
        self.getBlockByNumber(blockNumber, cb);
      },
      
      function(block, cb) {
        if(block === null)
        {
          return cb();
        }
        let transaction = block.getTransaction(trasactionHash);
        if(transaction)
        {
          return cb(TRANSACTION_FOUND, transaction);
        }
        cb();
      }], cb);
  }
}