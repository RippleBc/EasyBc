const assert = require("assert");
const Account = require("../../depends/account");
const Transaction = require("../../depends/transaction");
const utils = require("../../depends/utils");
const { SUCCESS } = require("../../constant");
const { randomBytes } = require("crypto");
const { TRANSACTION_STATE_PACKED } = require("../../constant");
const rp = require("request-promise");

const BN = utils.BN;
const bufferToInt = utils.bufferToInt;
const createPrivateKey = utils.createPrivateKey;
const publicToAddress = utils.publicToAddress;
const privateToPublic = utils.privateToPublic;
const padToEven = utils.padToEven;

var g_accounts = [];

var g_urls;
var g_selfKeyPairs;
var g_targetKeyPairs;
var g_value;

/*
 * @param {String} url
 * @param {String} address
 * @return {Account} 
 */
const getAccountInfo = async (url, address) => {
  assert(typeof address === "string", `getAccountInfo, address should be a String, now is ${typeof address}`);
  assert(typeof url === "string", `getAccountInfo, url should be a String, now is ${typeof url}`);

  const options = {
    method: "POST",
    uri: `${url}/getAccountInfo`,
    body: {
      address: address
    },
    json: true
  };

  const { code, data, msg } = await rp(options);

  if (code !== SUCCESS) {
    await Promise.reject(`getAccountInfo, throw exception, ${msg}`)
  }

  let account;
  if (data) {
    account = new Account(Buffer.from(data, "hex"));
  }
  else {
    account = new Account();
  }

  return account;
}

/**
 * @param {String} url
 * @param {String} hash 
 */
const checkIfTransactionPacked = async (url, hash) => {
  assert(typeof hash === 'string', `checkIfTransactionPacked, hash should be a String, now is ${typeof hash}`);

  const options = {
    method: "POST",
    uri: `${url}/getTransactionState`,
    body: {
      hash: hash
    },
    json: true
  };

  const { code, data, msg } = await rp(options);

  if (code !== SUCCESS) {
    await Promise.reject(`checkIfTransactionPacked, throw exception, ${msg}`)
  }

  return data;
}

/**
 * @param {String} url
 * @param {String} tx
 */
const sendTransaction = async (url, tx) => {
  assert(typeof url === "string", `sendTransaction, url should be a String, now is ${typeof url}`);
  assert(typeof tx === "string", `sendTransaction, tx should be a String, now is ${typeof tx}`);

  const options = {
    method: "POST",
    uri: `${url}/sendTransaction`,
    body: {
      tx: tx
    },
    json: true
  };

  const { code, msg } = await rp(options);

  if (code !== SUCCESS) {
    await Promise.reject(`sendTransaction, throw exception, ${url}, ${msg}`)
  }
}

/**
 * @param {String} privateKey
 * @param {String} nonce
 * @param {String} to
 * @param {Buffer} value
 * @return {Object}
 *  - prop {String} tx
 *  - prop {String} hash
 */
const generateTx = (privateKey, nonce, to, value) => {
  assert(typeof privateKey === 'string', `generateTx, privateKey should be a Hex String, now is ${typeof privateKey}`);
  assert(typeof nonce === 'string', `generateTx, nonce should be a Hex String, now is ${typeof nonce}`);
  assert(typeof to === 'string', `generateTx, to should be a Hex String, now is ${typeof to}`);
  assert(Buffer.isBuffer(value), `generateTx, value should be an Buffer, now is ${typeof value}`);

  // init tx
  const transaction = new Transaction({
    timestamp: Date.now(),
    nonce: Buffer.from(padToEven(nonce), "hex"),
    to: Buffer.from(to, "hex"),
    value: value
  })
  // sign
  transaction.sign(Buffer.from(privateKey, "hex"));

  return { 
    hash: transaction.hash().toString('hex'),
    txRaw: transaction.serialize().toString("hex")
  };
}

/**
 * @param {Number} size
 * @return {Buffer}
 */
function genRandomNumber(size) {

  assert(typeof size === 'number', `genRandomNumber, size should be a Number, now is typeof ${size}`);

  if (size < 1) {
    throw new Error(`genRandomNumber, size should bigger than 0, now is ${size}`);
  }

  const random = randomBytes(size);
  random[size - 1] |= 0x01;

  return random;
}

/**
 * @return {String} transaction raw data
 */
const generateRandomTx = () => {
  // init from private
  const privateKeyFrom = createPrivateKey();

  // init to Address
  const privateKeyTo = createPrivateKey();
  const publicKeyTo = privateToPublic(privateKeyTo);
  const addressTo = publicToAddress(publicKeyTo);

  // init tx
  const nonce = genRandomNumber(1);
  const value = genRandomNumber(1);
  const transaction = new Transaction({
    timestamp: Date.now(),
    nonce: nonce,
    to: addressTo,
    value: value
  });

  // sign
  transaction.sign(privateKeyFrom);

  return transaction.serialize().toString("hex");
}

/**
 * @param {Number} range 
 */
function getRandomIndex(range)
{
  assert(typeof range === 'number', `getRandomIndex, range should be a Number, now is ${typeof range}`);

  const random = randomBytes(4);

  return bufferToInt(random) % range;
}

var g_lastInitAccountTime = 0;
var g_initAccountsInterval = 0;
async function initAccounts(url, keyPairs)
{
  assert(typeof url === 'string', `initAccounts, url should be a String, now is ${typeof url}`);
  assert(Array.isArray(keyPairs), `initAccounts, keyPairs should be an Array, now is ${typeof keyPairs}`);

  const now = Date.now();
  const canSendTxAccountNum = g_accounts.filter(el => {
    return new BN(el.balance).gt(new BN(g_value));
  }).length;

  // 
  if (now < g_lastInitAccountTime + g_initAccountsInterval 
    && canSendTxAccountNum > Math.round(g_accounts.length / 2)) {
    return;
  }

  //
  if (g_initAccountsInterval < 10000) {
    g_initAccountsInterval += 10;
  }
  g_lastInitAccountTime = now;

  // update accounts
  const getAccountInfoPromises = [];
  for (let [index, { address }] of keyPairs.entries()) {
    if (g_accounts[index] && new BN(g_accounts[index].balance).gt(new BN(g_value).muln(4)))
    {
      getAccountInfoPromises.push(new Promise(resolve => {
        resolve(g_accounts[index]);
      }))
    }
    else
    {
      getAccountInfoPromises.push(getAccountInfo(url, address));
    }
  }

  g_accounts = await Promise.all(getAccountInfoPromises)
}

/**
 * @param {String} url 
 */
async function runProfile(url)
{
  assert(typeof url === 'string', `runProfile, url should be an String, now is ${typeof url}`);

  let processedTxNum = 0;

  // send random tx
  const sendRandomTxPromises = []
  for (let i = 0; i < 2; i++) {
    const randomTxRaw = generateRandomTx();
    sendRandomTxPromises.push(sendTransaction(url, randomTxRaw));
  }
  await Promise.all(sendRandomTxPromises)

  // send tx
  const sendTxPromises = [];
  let txhashes = [];
  for (let [index, account] of g_accounts.entries()) {
    if (new BN(account.balance).lt(new BN(g_value))) {
      continue;
    }

    processedTxNum ++;
    
    // init to address
    const toAddressIndex = getRandomIndex(g_targetKeyPairs.length);
    const toAddressHex = g_targetKeyPairs[toAddressIndex].address;

    // send tx
    const {txRaw, hash} = generateTx(g_selfKeyPairs[index].privateKey, new BN(account.nonce).addn(1).toBuffer().toString('hex'), toAddressHex, g_value)
    sendTxPromises.push(sendTransaction(url, txRaw));

    // record tx hash
    txhashes.push(hash);

    // update account nonce and balance
    account.nonce = new BN(account.nonce).addn(1).toBuffer();
    account.balance = new BN(account.balance).sub(new BN(g_value)).toBuffer();
  }
  await Promise.all(sendTxPromises);

  // validate
  let i = 0;
  while (txhashes.length > 0 && i < 10) {
    const checkIfTxPackedPromises = []
    for (let txHash of txhashes) {
      checkIfTxPackedPromises.push(checkIfTransactionPacked(url, txHash));
    }
    const checkResults = await Promise.all(checkIfTxPackedPromises);

    const tmpTxHashes = []
    for (let [index, ifTxPacked] of checkResults.entries()) {
      if (ifTxPacked !== TRANSACTION_STATE_PACKED) {
        tmpTxHashes.push(txhashes[index]);
      }
    }
    txhashes = tmpTxHashes;

    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 500)
    });

    i++;
  }

  if (txhashes.length > 0) {
    await Promise.reject(`some tx has not packed, ${txhashes}`);
  }

  return processedTxNum;
}

/**
 * @param {Array} urls
 * @param {Array} selfKeyPairs
 * @param {Array} targetKeyPairs
 * @param {Number} value
 */
process.on('message', ({ urls, selfKeyPairs, targetKeyPairs, value }) => {
  assert(Array.isArray(urls), `startProfile, urls should be an Array, now is ${typeof urls}`);
  assert(Array.isArray(selfKeyPairs), `startProfile, selfKeyPairs should be an Array, now is ${typeof selfKeyPairs}`);
  assert(Array.isArray(targetKeyPairs), `startProfile, targetKeyPairs should be an Array, now is ${typeof targetKeyPairs}`);
  assert(typeof value === 'string', `startProfile, value should be an String, now is ${typeof value}`)
  
  g_urls = urls;
  g_selfKeyPairs = selfKeyPairs;
  g_targetKeyPairs = targetKeyPairs;
  g_value = Buffer.from(value, 'hex');

  
  (async () => {
    while (true) {
      // init url
      const url = g_urls[getRandomIndex(g_urls.length)]

      await initAccounts(url, g_selfKeyPairs);

      const processedTxNum = await runProfile(url);

      if (processedTxNum > 0)
      {
        process.send({
          processedTxNum: processedTxNum
        });
      }
    }
  })().catch(e => {
    process.send({ 
      err: e.stack ? e.stack : e
    })

    process.exit(1);
  })
});