const utils = require("../../depends/utils");
const Transaction = require("../../depends/transaction");
const { getAccountInfo } = require("../remote");
const assert = require("assert");
const { Account: AccountModel, TransactionsHistory: TransactionsHistoryModel } = process[Symbol.for("models")];
const { SUCCESS, OTH_ERR, PARAM_ERR } = require("../../constant");
const { COMMAND_TX } = require("../../consensus_constracts/constant");
const rp = require("request-promise");

const app = process[Symbol.for("app")];
const printErrorStack = process[Symbol.for("printErrorStack")];

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

      // record
      returnData.push({
        form: tx.from,
        to: tx.to,
        value: tx.value,
        data: req.body.data,
        privateKey: req.body.privateKey,
        txHash: txHash
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