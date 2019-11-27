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

  module.exports.sendTransactions(req.query.url, req.query.from, req.query.to, req.query.value, data, req.query.privateKey).then(([transactionHash]) => {
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
  });
});

app.post("/batchSendTransactionsWithSameFrom", (req, res) => {
  if (!req.body.url) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need url"
    });
  }

  if (!req.body.tos) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need tos"
    });
  }

  if (!req.body.value) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need value"
    });
  }

  // reconstruct data
  let data;
  if (tx.data) {
    data = utils.rlp([toBuffer(COMMAND_TX), Buffer.from(req.body.data)]).toString("hex");
  }

  //
  let returnData = [];
  (async () => {
    const txsHash = await module.exports.sendTransactions(req.body.url, req.body.from, tx.tos, req.body.value, data, req.body.privateKey)
    
    //
    for(let [index, txHash] of txsHash)
    {
      const tx = tx.tos[index];

      // check
      const txState = await checkTransaction(req.body.url, txHash)

      //
      returnData.push({
        index: tx.index,
        to: tx.to,
        value: tx.value,
        txHash: txHash,
        state: txState
      })
    }

  })().catch(e => {
    res.json({
      code: OTH_ERR,
      data: e
    });
  }).finally(() => {
    res.json({
      code: SUCCESS,
      data: returnData
    });
  });
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
      const [txHash] = await module.exports.sendTransactions(req.body.url, tx.from, tx.to, tx.value, data, tx.privateKey);
      
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

  assert(typeof url === 'string', `checkTransaction url should be a String, now is ${typeof url}`);
  assert(typeof txHash === 'string', `checkTransaction txHash should be a String, now is ${typeof txHash}`);

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
 * @param {Array} tos
 * @param {String} value
 * @param {String} data
 * @param {String} privateKey
 */
module.exports.sendTransactions = async (url, from, tos, value, data, privateKey) => {
  // check url
  assert(typeof url === "string", `sendTransactions, url should be a String, now is ${typeof url}`);

  // check privateKey
  if (privateKey) {
    assert(typeof privateKey === "string", `sendTransactions, privateKey should be an String, now is ${typeof privateKey}`);
    if (privateKey.length !== 64) {
      await Promise.reject("sendTransactions, invalid privateKey")
    }
  }

  // check from
  if (from) {
    assert(typeof from === "string", `sendTransactions, from should be an String, now is ${typeof from}`);
    if (from.length !== 40) {
      await Promise.reject("sendTransactions, invalid from address")
    }
  }

  if (data) {
    assert(typeof data === "string", `sendTransactions, data should be an String, now is ${typeof data}`);
  }

  // check to
  if (typeof tos === "string")
  {
    if (tos.length !== 40) {
      await Promise.reject("sendTransactions, invalid tos address")
    }

    tos = [tos];
  }
  else if(Array.isArray(tos))
  {

  }
  else
  {
    await Promise.reject(`sendTransactions, to should be an String or Array, now is ${typeof to}`)
  }

  // check value
  assert(typeof value === "string", `sendTransactions, value should be an String, now is ${typeof value}`);
  if (value === "") {
    await Promise.reject("sendTransactions, invalid value");
  }

  if (privateKey === undefined) {
    // fetch privateKey from db according from
    if (from === undefined) {
      await Promise.reject("sendTransactions, when privateKey is undefined, from must be supplied")
    }

    ({ privateKey } = await AccountModel.findOne({
      attributes: ["privateKey"],
      where: {
        address: from
      }
    }))

    if (privateKey === undefined || privateKey === null) {
      await Promise.reject(`sendTransactions, from ${from}'s corresponding privateKey is not exist`)
    }
  }
  else {
    // compute from according privateKey
    const public = utils.privateToPublic(Buffer.from(privateKey, "hex"))
    from = utils.publicToAddress(public).toString("hex");
  }

  // get account
  const accountInfo = await getAccountInfo(url, from);
  
  //
  let currentNonceBn = new BN(accountInfo.nonce);
  let txHashes = [];
  
  for (let to of tos)
  {
    currentNonceBn.iaddn(1);

    // init tx
    const tx = new Transaction();
    tx.nonce = currentNonceBn.toArrayLike(Buffer);
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
    });

    // send
    rp({
      method: "POST",
      uri: `${url}/sendTransaction`,
      body: {
        tx: tx.serialize().toString("hex")
      },
      json: true
    });

    // record hash
    txHashes.push(tx.hash().toString('hex'))
  }
  
  return txHashes;
}