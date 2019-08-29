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

const SEND_VALUE_HEX = "01";

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
 * @param {String} value
 * @return {Object}
 *  - prop {String} tx
 *  - prop {String} hash
 */
const generateTx = (privateKey, nonce, to, value) => {
  assert(`generateTx, privateKey should be a Hex String, now is ${typeof privateKey}`);
  assert(`generateTx, nonce should be a Hex String, now is ${typeof nonce}`);
  assert(`generateTx, to should be a Hex String, now is ${typeof to}`);
  assert(`generateTx, value should be a Hex String, now is ${typeof value}`);

  // init tx
  const transaction = new Transaction({
    timestamp: Date.now(),
    nonce: Buffer.from(padToEven(nonce), "hex"),
    to: Buffer.from(to, "hex"),
    value: Buffer.from(value, "hex")
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

async function initAccounts(url, keyPairs)
{
  g_accounts = [];

  for (let { address } of keyPairs) {
    g_accounts.push(await getAccountInfo(url, address))
  }
}

/**
 * @param {Array} urls
 * @param {Array} selfKeyPairs
 * @param {Array} targetKeyPairs
 */
async function runProfile(urls, selfKeyPairs, targetKeyPairs)
{
  assert(Array.isArray(urls), `runProfile, urls should be an Array, now is ${typeof urls}`);
  assert(Array.isArray(selfKeyPairs), `runProfile, selfKeyPairs should be an Array, now is ${typeof selfKeyPairs}`);
  assert(Array.isArray(targetKeyPairs), `runProfile, targetKeyPairs should be an Array, now is ${typeof targetKeyPairs}`);

  // init to address
  let toAddressIndex = getRandomIndex(targetKeyPairs.length);
  let toAddressHex = targetKeyPairs[toAddressIndex].address;

  // init url
  const url = urls[getRandomIndex(urls.length)]

  // init account
  await initAccounts(url, selfKeyPairs);

  // send random tx
  for (let i = 0; i < 8; i++) {
    const randomTx = generateRandomTx();
    await sendTransaction(url, randomTx);
  }

  // send tx
  const sendTxPromises = [];
  let txhashes = [];
  for (let [index, account] of g_accounts.entries()) {
    if (new BN(account.balance).lt(Buffer.from(SEND_VALUE_HEX, 'hex'))) {
      continue;
    }

    console.info(`sendTransaction privateKey: ${selfKeyPairs[index].privateKey}, nonce: ${new BN(account.nonce).addn(1).toBuffer().toString('hex')}, to: ${toAddressHex}, value: ${SEND_VALUE_HEX}`)

    const {txRaw, hash} = generateTx(selfKeyPairs[index].privateKey, new BN(account.nonce).addn(1).toBuffer().toString('hex'), toAddressHex, SEND_VALUE_HEX)
    sendTxPromises.push(sendTransaction(url, txRaw));
    txhashes.push(hash);
  }
  await Promise.all(sendTxPromises);

  // validate
  let i = 0;
  while (i < 10 && txhashes.length > 0) {
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

  if (i >= 10) {
    await Promise.reject(`some tx has not packet, ${txhashes}`);
  }
}

/**
 * @param {Array} urls
 * @param {Array} selfKeyPairs
 * @param {Array} targetKeyPairs
 */
process.on('message', ({ urls, selfKeyPairs, targetKeyPairs}) => {
  assert(Array.isArray(urls), `startProfile, urls should be an Array, now is ${typeof urls}`);
  assert(Array.isArray(selfKeyPairs), `startProfile, selfKeyPairs should be an Array, now is ${typeof selfKeyPairs}`);
  assert(Array.isArray(targetKeyPairs), `startProfile, targetKeyPairs should be an Array, now is ${typeof targetKeyPairs}`);

  (async () => {
    while (true) {
      await runProfile(urls, selfKeyPairs, targetKeyPairs);
    }
  })().catch(e => {
    console.error(e.stack ? e.stack : e);

    process.send({ 
      err: e.stack ? e.stack : e
    })

    process.exit(1);
  })
});