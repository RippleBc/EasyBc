const utils = require("../../depends/utils");
const Transaction = require("../../depends/transaction");
const { getAccountInfo } = require("../remote");
const assert = require("assert");
const { Account: AccountModel, TransactionsHistory: TransactionsHistoryModel } = process[Symbol.for("models")];
const { SUCCESS, OTH_ERR, PARAM_ERR, TRANSACTION_STATE_PACKED } = require("../../constant");
const { COMMAND_TX } = require("../../consensus_constracts/constant");
const rp = require("request-promise");

const app = process[Symbol.for("app")];
const printErrorStack = process[Symbol.for("printErrorStack")];

const logger = process[Symbol.for("logger")];

const Buffer = utils.Buffer;
const BN = utils.BN;
const toBuffer = utils.toBuffer;

app.get("/sendTransaction", function (req, res) {
  if (!req.query.url) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need url"
    });
  }

  if (!req.query.from) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need from"
    });
  }

  if (!req.query.to) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need to"
    });
  }

  if (!req.query.value) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need value"
    });
  }

  let data;
  if (req.query.data) {
    data = utils.rlp([toBuffer(COMMAND_TX), Buffer.from(req.query.data)]).toString("hex");
  }

  module.exports.sendTransaction(req.query.url, req.query.from, req.query.to, req.query.value, data, req.query.privateKey).then(transactionHash => {
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

app.post("/batchSendTransactions", (req, res) => {
  if (!req.body.url) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need url"
    });
  }

  if (!req.body.txs) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need txs"
    });
  }

  let returnData = [];

  (async () => {
    for (let tx of req.body.txs) {
      // reconstruct data
      let data;
      if (tx.data) {
        data = utils.rlp([toBuffer(COMMAND_TX), Buffer.from(tx.data)]).toString("hex");
      }

      // send tx
      const txHash = await module.exports.sendTransaction(req.body.url, tx.from, tx.to, tx.value, data, tx.privateKey);
      
      // check
      const state = await checkTransaction(req.body.url, txHash)

      // record
      returnData.push({
        index: tx.index,
        form: tx.from,
        to: tx.to,
        value: tx.value,
        data: req.body.data,
        privateKey: req.body.privateKey,
        txHash: txHash,
        state: state
      });
    }
  })().catch(e => {
    printErrorStack(e);
  }).finally(() => {
    res.json({
      code: SUCCESS,
      data: returnData
    })
  })
});

const CHECK_TRANSACTION_STATE_MAX_TRY_TIMES = 20;
const TX_HANDLE_FAILED = 0;
const TX_HANDLE_SUCCESS = 1;

const checkTransaction = async (url, txHash) => {

  assert(typeof url === 'string', `checkTransaction url should be a String, now is ${url}`);
  assert(typeof txHash === 'string', `checkTransaction txHash should be a String, now is ${txHash}`);

  let index = 0;

  let data;
  do {
    try {
      ({ data } = await rp({
        method: "POST",
        uri: `${url}/getTransactionState`,
        body: {
          hash: txHash
        },
        json: true
      }));
    } catch (e) {
      printErrorStack(e)
    }
    

    if(index !== 0)
    {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, 100)
      });
    }

    index ++;

  } while (data !== TRANSACTION_STATE_PACKED && index < CHECK_TRANSACTION_STATE_MAX_TRY_TIMES)

  if(index < CHECK_TRANSACTION_STATE_MAX_TRY_TIMES)
  {
    return TX_HANDLE_SUCCESS;
  }
  else
  {
    return TX_HANDLE_FAILED;
  }
}

/**
 * @param {String} url
 * @param {String} from
 * @param {String} to
 * @param {String} value
 * @param {String} data
 * @param {String} privateKey
 */
module.exports.sendTransaction = async (url, from, to, value, data, privateKey) => {
  // check url
  assert(typeof url === "string", `sendTransaction, url should be a String, now is ${typeof url}`);

  // check privateKey
  if (privateKey) {
    assert(typeof privateKey === "string", `sendTransaction, privateKey should be an String, now is ${typeof privateKey}`);
    if (privateKey.length !== 64) {
      await Promise.reject("sendTransaction, invalid privateKey")
    }
  }

  // check from
  if (from) {
    assert(typeof from === "string", `sendTransaction, from should be an String, now is ${typeof from}`);
    if (from.length !== 40) {
      await Promise.reject("sendTransaction, invalid from address")
    }
  }

  if (data) {
    assert(typeof data === "string", `sendTransaction, data should be an String, now is ${typeof data}`);
  }
  // check to
  assert(typeof to === "string", `sendTransaction, to should be an String, now is ${typeof to}`);
  if (to.length !== 40) {
    await Promise.reject("sendTransaction, invalid to address")
  }

  // check value
  assert(typeof value === "string", `sendTransaction, value should be an String, now is ${typeof value}`);
  if (value === "") {
    await Promise.reject("sendTransaction, invalid value");
  }

  if (privateKey === undefined) {
    // fetch privateKey from db according from
    if (from === undefined) {
      await Promise.reject("sendTransaction, when privateKey is undefined, from must be supplied")
    }

    ({ privateKey } = await AccountModel.findOne({
      attributes: ["privateKey"],
      where: {
        address: from
      }
    }))

    if (privateKey === undefined || privateKey === null) {
      await Promise.reject(`sendTransaction, from ${from}'s corresponding privateKey is not exist`)
    }
  }
  else {
    // compute from according privateKey
    const public = utils.privateToPublic(Buffer.from(privateKey, "hex"))
    from = utils.publicToAddress(public).toString("hex");
  }

  // get account
  const accountInfo = await getAccountInfo(url, from);

  // init tx
  const tx = new Transaction();
  tx.nonce = (new BN(accountInfo.nonce).addn(1)).toArrayLike(Buffer);
  tx.timestamp = Date.now();
  tx.value = Buffer.from(value, "hex");
  tx.data = data ? Buffer.from(data, "hex") : Buffer.alloc(0);
  tx.to = Buffer.from(to, "hex");
  tx.sign(Buffer.from(privateKey, "hex"));

  // save transaction history
  await TransactionsHistoryModel.create({
    from: from,
    to: to,
    value: value
  })

  const options = {
    method: "POST",
    uri: `${url}/sendTransaction`,
    body: {
      tx: tx.serialize().toString("hex")
    },
    json: true
  };


  const response = await rp(options);
  if (response.code !== SUCCESS) {
    await Promise.reject(response.msg);
  }

  return tx.hash().toString("hex");
}