const assert = require("assert");
const Account = require("../../depends/account");
const Transaction = require("../../depends/transaction");
const utils = require("../../depends/utils");
const { spawn } = require("child_process");
const { SUCCESS } = require("../../constant");
const { randomBytes } = require("crypto");
const { LoadingBar } = require("../utils");

const BN = utils.BN;
const createPrivateKey = utils.createPrivateKey;
const publicToAddress = utils.publicToAddress;
const privateToPublic = utils.privateToPublic;
const padToEven = utils.padToEven;

/*
 * @param {String} url ex "http://123.157.68.243:10011"
 * @param {String} address ex "21d21b68ded27ce2ef619651d382892c1f77baa4"
 * @return {Object} 
 *   @prop {Buffer} balance
 *   @prop {Buffer} nonce
 */
const getAccountInfo = async (url, address) => {
  assert(typeof address === "string", `getAccountInfo, address should be a String, now is ${typeof address}`);
  assert(typeof url === "string", `getAccountInfo, url should be a String, now is ${typeof url}`);

  const curl = spawn("curl", ["-H", "Content-Type:application/json", "-X", "POST", "--data", `{"address": "${address}"}`, `${url}/getAccountInfo`]);

  const returnDataArray = []
  const errDataArray = []

  curl.stdout.on('data', data => {
    returnDataArray.push(data);
  });

  curl.stderr.on('data', data => {
    errDataArray.push(data);
  });

  const promise =  new Promise((resolve, reject) => {
    curl.on('close', exitCode => {
      if(exitCode !== 0) {
        reject(`getAccountInfo close abnormally, ${exitCode}`);
      }

      const { code, data, msg } = JSON.parse(Buffer.concat(returnDataArray).toString());
      if(code !== SUCCESS)
      {
        reject(`getAccountInfo, throw exception, ${msg}`)
      }

      let account;
      if(data)
      {
        account = new Account(Buffer.from(data, "hex"));
      }
      else
      {
        account = new Account();
      }

      resolve({nonce: account.nonce, balance: account.balance});
    });
  })
  
  return await promise;
}

/**
 * @param {String} privateKey
 * @param {String} nonce
 * @param {String} to
 * @param {String} value
 * @return {String} transaction raw data
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

  return transaction.serialize().toString("hex");
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

  // console.log(`privateKeyFrom: ${privateKeyFrom.toString("hex")}`)
  // console.log(`nonce: ${nonce.toString("hex")}`)
  // console.log(`to: ${addressTo.toString("hex")}`)
  // console.log(`value: ${value.toString("hex")}`)

  return transaction.serialize().toString("hex");
}

/**
 * @param {String} url
 * @param {String} tx
 */
const sendTransaction = async (url, tx) => {
  assert(typeof url === "string", `sendTransaction, url should be a String, now is ${typeof url}`);
  assert(typeof tx === "string", `sendTransaction, tx should be a String, now is ${typeof tx}`);

  const curl = spawn("curl", ["-H", "Content-Type:application/json", "-X", "POST", "--data", `{"tx": "${tx}"}`, `${url}/sendTransaction`]);

  const sucDataArray = [];
  const errDataArray = [];

  curl.stdout.on('data', data => {
    sucDataArray.push(data);
  });

  curl.stderr.on('data', data => {
    errDataArray.push(data);
  });

  const promise =  new Promise((resolve, reject) => {
    curl.on('close', exitCode => {
      if(exitCode !== 0) {
        reject(`sendTransaction close abnormally, ${exitCode}`);
      }

      try
      {
        const { code, data, msg } = JSON.parse(Buffer.concat(sucDataArray).toString());

        if(code !== SUCCESS)
        {
          reject(`sendTransaction, throw exception, ${url}, ${msg}`)
        }
      }
      catch(e)
      {
        reject(`sendTransaction, throw exception, ${url}, ${e}`)
      }

      resolve();
    });
  })
  
  return await promise;
}

/**
 * @param {Number} size
 */
function genRandomNumber(size) {

  assert(typeof size === 'number', `genRandomNumber, size should be a Number, now is typeof ${size}`);

  if(size < 1)
  {
    throw new Error(`genRandomNumber, size should bigger than 0, now is ${size}`);
  }

  const random = randomBytes(size);
  random[size - 1] |= 0x01;

  return random;
}

/**
 * @param {Array} urls
 * @param {Number} num
 */
module.exports = async (urls, num) => {
  const loadingBar = new LoadingBar();
  loadingBar.start();

  // get account info
  const tx_from = "21d21b68ded27ce2ef619651d382892c1f77baa4";
  const tx_to = "37faf6b0dd1c4faa396f975ffd350e25e8036bc7";
  const { nonce: nonceFrom, balance: balanceFrom } = await getAccountInfo(urls[0], tx_from)
  const { nonce: nonceTo, balance: balanceTo } = await getAccountInfo(urls[0], tx_to)

  console.info(`tx_from: ${tx_from}, nonce: ${nonceFrom.toString("hex")}, balance: ${balanceFrom.toString("hex")}`)
  console.info(`tx_from: ${tx_to}, nonce: ${nonceTo.toString("hex")}, balance: ${balanceTo.toString("hex")}`)

  for(let i = 0; i < num - 1; i++)
  {
    // send transaction
    let sendTransactionPromises = [];
    for(let url of urls)
    {
      // generate tx raw
      const txRaw = generateRandomTx(); 
      sendTransaction(url, txRaw).then(() => {
        
      }).catch(e => {
        console.error(`sendTransaction throw exception, ${e}`);
      });
    }
  }

  // init tx
  const tx_privateKeyFrom = "ed09a7280c5a0d3c04839ca5603fe507b4d1d4572601e62aadafd923f55f7bf9";
  const tx_nonce = (new BN(nonceFrom).iaddn(1)).toString("hex");
  const tx_value = "01"
  const txRaw = generateTx(tx_privateKeyFrom, tx_nonce, tx_to, tx_value);

  // send transaction
  let sendTransactionPromises = [];
  for(let url of urls)
  {
    sendTransactionPromises.push(sendTransaction(url, txRaw));
  }
  await Promise.all(sendTransactionPromises);

  console.time(`\n\n${num} txs time consume: `);

  // check balance
  await (async () => {
    let index = 0;
    while(index ++ < 800)
    {
      const { nonce: nonceFromNew, balance: balanceFromNew } = await getAccountInfo(urls[0], tx_from)
      const { nonce: nonceToNew, balance: balanceToNew } = await getAccountInfo(urls[0], tx_to)

      if(new BN(nonceFromNew).toString("hex") === new BN(nonceFrom).addn(1).toString("hex") &&
        new BN(balanceFromNew).toString("hex") === new BN(balanceFrom).subn(1).toString("hex") &&
        new BN(balanceToNew).toString("hex") === new BN(balanceTo).addn(1).toString("hex"))
      {
        console.timeEnd(`\n\n${num} txs time consume: `);
        return;
      }

      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, 100);
      })
    }

    console.log("\n\ntxs consensus is too slow, please find the reason");
  })();

  loadingBar.end();
}