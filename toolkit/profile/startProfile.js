const assert = require("assert");
const utils = require("../../depends/utils");
const { TRANSACTION_STATE_PACKED } = require("../../constant");
const { getAccountInfo, 
  checkIfTransactionPacked,
  sendTransaction,
  generateSpecifiedTx,
  generateRandomTx,
  getRandomIndex } = require("./utils");

const BN = utils.BN;

var g_accounts = [];

var g_selfKeyPairs;
var g_targetKeyPairs;
var g_value;
var g_validate;

/**
 * @param {String} url 
 * @param {Array} keyPairs 
 */
async function initAccounts(url, keyPairs)
{
  assert(typeof url === 'string', `initAccounts, url should be a String, now is ${typeof url}`);
  assert(Array.isArray(keyPairs), `initAccounts, keyPairs should be an Array, now is ${typeof keyPairs}`);

  // check if there is enough accounts can send txs
  if (g_accounts.filter(el => {
    return new BN(el.balance).gt(new BN(g_value));
  }).length > Math.round(g_accounts.length / 2)) {
    return;
  }

  // update accounts
  const getAccountInfoPromises = [];
  for (let { address } of keyPairs) {
    getAccountInfoPromises.push(getAccountInfo(url, address));
  }

  g_accounts = await Promise.all(getAccountInfoPromises);
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
  let txsInf = [];
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
    txsInf.push({
      txHash: hash,
      privateKey: g_selfKeyPairs[index].privateKey,
      nonce: new BN(account.nonce).addn(1).toBuffer().toString('hex'),
      from: g_selfKeyPairs[index].address,
      to: toAddressHex,
      value: g_value.toString('hex')
    });

    // update account nonce and balance
    account.nonce = new BN(account.nonce).addn(1).toBuffer();
    account.balance = new BN(account.balance).sub(new BN(g_value)).toBuffer();
  }
  await Promise.all(sendTxPromises);

  //
  if (!g_validate)
  {
    return processedTxNum;
  }

  // validate
  let i = 0;
  while (txsInf.length > 0 && i < 10) {
    const checkIfTxPackedPromises = []
    for (let { txHash } of txsInf) {
      checkIfTxPackedPromises.push(checkIfTransactionPacked(url, txHash));
    }
    const checkResults = await Promise.all(checkIfTxPackedPromises);

    const tmpTxsInfo = []
    for (let [index, ifTxPacked] of checkResults.entries()) {
      if (ifTxPacked !== TRANSACTION_STATE_PACKED) {
        tmpTxsInfo.push(txsInf[index]);
      }
    }
    txsInf = tmpTxsInfo;

    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });

    i++;
  }

  if (txsInf.length > 0) {
    await Promise.reject(`some tx has not packed:\n ${txsInf.map(({
      txHash, 
      privateKey,
      nonce,
      from,
      to,
      value
    }) => `txHash: ${txHash}, privateKey: ${privateKey}, nonce: ${nonce}, from: ${from}, to: ${to}, value: ${value}`).join('\n')}`);
  }

  return processedTxNum;
}

/**
 * @param {String} url
 * @param {Array} selfKeyPairs
 * @param {Array} targetKeyPairs
 * @param {Number} value
 * @param {Boolean} validate
 */
process.on('message', ({ url, selfKeyPairs, targetKeyPairs, value, validate }) => {
  assert(typeof url === 'string', `startProfile, url should be a String, now is ${typeof url}`);
  assert(Array.isArray(selfKeyPairs), `startProfile, selfKeyPairs should be an Array, now is ${typeof selfKeyPairs}`);
  assert(Array.isArray(targetKeyPairs), `startProfile, targetKeyPairs should be an Array, now is ${typeof targetKeyPairs}`);
  assert(typeof value === 'string', `startProfile, value should be an String, now is ${typeof value}`)
  
  g_selfKeyPairs = selfKeyPairs;
  g_targetKeyPairs = targetKeyPairs;
  g_value = Buffer.from(value, 'hex');
  g_validate = validate;

  let beginTime;
  (async () => {
    while (true)  {
      // update account cache
      await initAccounts(url, g_selfKeyPairs);

      //
      beginTime = parseInt(Date.now() / 1000);

      // send txs and valid
      const processedTxNum = await runProfile(url);

      //
      if (processedTxNum > 0)
      {
        process.send({
          processedTxNum: processedTxNum,
          consumedTime: parseInt(Date.now() / 1000) - beginTime
        });
      }
    }
  })().catch(e => {
    process.send({
      err: e.stack ? e.stack : e,
      consumedTime: parseInt(Date.now() / 1000) - beginTime
    })

    process.exit(1);
  })
});