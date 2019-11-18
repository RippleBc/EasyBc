const assert = require("assert");
const utils = require("../../depends/utils");
const { TRANSACTION_STATE_PACKED } = require("../../constant");
const { getAccountInfo, 
  checkIfTransactionPacked,
  sendTransaction,
  generateSpecifiedTx,
  generateRandomTx,
  getRandomIndex } = require("./utils");
const { randomBytes } = require("crypto");

const BN = utils.BN;

var g_accounts = [];

var g_urls;
var g_selfKeyPairs;
var g_targetKeyPairs;
var g_value;

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

  // send invalid random tx
  const sendRandomTxPromises = []
  for (let i = 0; i < 2; i++) {
    const randomTxRaw = generateRandomTx();
    sendRandomTxPromises.push(sendTransaction(url, randomTxRaw));
  }
  await Promise.all(sendRandomTxPromises)

  // send specified valid txs
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
    const {txRaw, hash} = generateSpecifiedTx(g_selfKeyPairs[index].privateKey, new BN(account.nonce).addn(1).toBuffer().toString('hex'), toAddressHex, g_value)
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
      }, 2000)
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