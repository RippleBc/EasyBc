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

const BATCH_SEND_TXS_MAX_SIZE = 50;

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

  let transactionHash;
  (async () => {
    ([transactionHash] = await module.exports.sendTransactions(req.query.url, req.query.from, [req.query.to, req.query.value, data], req.query.privateKey));

    await checkTransaction(req.query.url, transactionHash);
  })().then(() => {
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

  //
  let returnData = [];

  // sort txs
  const sortedTxsByFrom = new Map();
  for (let tx of req.body.txs)
  {
    let sortedTxWithSameFrom = sortedTxsByFrom.get(tx.from);

    //
    if (!sortedTxWithSameFrom)
    {
      sortedTxWithSameFrom = {
        privateKey: tx.privateKey,
        toDetails: []
      };
    }

    //
    sortedTxWithSameFrom.toDetails.push(tx.to);
    sortedTxWithSameFrom.toDetails.push(tx.value);

    // reconstruct data
    let data;
    if (tx.data) {
      data = utils.rlp([toBuffer(COMMAND_TX), Buffer.from(tx.data)]).toString("hex");
    }
    sortedTxWithSameFrom.toDetails.push(data);

    //
    sortedTxsByFrom.set(tx.from, sortedTxWithSameFrom);
  }


  /**
   * 
   * @param {String} from 
   * @param {String} privateKey 
   * @param {Array} toDetails 
   */
  const sendTransactionsWithSameFrom = async (from, privateKey, toDetails) => {
    assert(typeof from === 'string', `sendTransactionsWithSameFrom from should be a String, now is ${typeof from}`);
    assert(typeof privateKey === 'string', `sendTransactionsWithSameFrom privateKey should be a String, now is ${typeof privateKey}`);
    assert(Array.isArray(toDetails), `sendTransactionsWithSameFrom from should be an Array, now is ${typeof toDetails}`);

    // send tx
    const txHashes = await module.exports.sendTransactions(req.body.url, from, toDetails, privateKey);

    // check tx
    const checkPromises = []
    for (let txHash of txHashes) {
      checkPromises.push(checkTransaction(req.body.url, txHash));
    }
    const stateResults = await Promise.all(checkPromises);

    // record
    for (let [index, txHash] of txHashes.entries()) {
      returnData.push({
        form: from,
        to: toDetails[index * 3],
        value: toDetails[index * 3 + 1],
        data: toDetails[index * 3 + 2],
        txHash: txHash,
        state: stateResults[index]
      });
    }
  }

  (async () => {
    const sendTxsWithSameFromPromises = [];

    for (let [from, { privateKey, toDetails }] of sortedTxsByFrom.entries()) {
      
      sendTxsWithSameFromPromises.push(sendTransactionsWithSameFrom(from, privateKey, toDetails))
    }

    await Promise.all(sendTxsWithSameFromPromises);
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
 * @param {Array} toDetails
 * @param {String} privateKey
 * @return {Array}
 */
module.exports.sendTransactions = async (url, from, toDetails, privateKey) => {
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

  // check toDetails
  assert(Array.isArray(toDetails), `sendTransactions, toDetails should be an Array`)
  if (toDetails.length > BATCH_SEND_TXS_MAX_SIZE) {
    await Promise.reject(`sendTransactions, amount of transactions should little than ${BATCH_SEND_TXS_MAX_SIZE}, now is ${toDetails.length}`);
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
  
  for(let i = 0; i < toDetails.length; i += 3)
  {
    const toAddress = toDetails[i];
    const value = toDetails[i + 1];
    const data = toDetails[i + 2];

    if (toAddress) {
      assert(typeof toAddress === "string", `sendTransactions, toAddress should be an String, now is ${typeof toAddress}`);
    }
    if (value) {
      assert(typeof value === "string", `sendTransactions, value should be an String, now is ${typeof value}`);
    }
    if (data) {
      assert(typeof data === "string", `sendTransactions, data should be an String, now is ${typeof data}`);
    }

    // check value
    assert(typeof value === "string", `sendTransactions, value should be an String, now is ${typeof value}`);
    if (value === "") {
      await Promise.reject("sendTransactions, invalid value");
    }

    // update nonce
    currentNonceBn.iaddn(1);

    // init tx
    const tx = new Transaction();
    tx.nonce = currentNonceBn.toArrayLike(Buffer);
    tx.timestamp = Date.now();
    tx.value = Buffer.from(value, "hex");
    tx.data = data ? Buffer.from(data, "hex") : Buffer.alloc(0);
    tx.to = Buffer.from(toAddress, "hex");
    tx.sign(Buffer.from(privateKey, "hex"));

    // send
    try {
      await rp({
        method: "POST",
        uri: `${url}/sendTransaction`,
        body: {
          tx: tx.serialize().toString("hex")
        },
        json: true
      });
    } catch (e) {
      printErrorStack(e);
    }

    // save transaction
    await TransactionsHistoryModel.create({
      txHash: tx.hash().toString('hex'),
      from: from,
      to: toAddress,
      nonce: tx.nonce.toString('hex'),
      value: value
    });
    
    // record hash
    txHashes.push(tx.hash().toString('hex'))
  }
  
  return txHashes;
}