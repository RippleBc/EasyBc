const assert = require("assert");
const Account = require("../depends/account");
const Transaction = require("../depends/transaction");
const utils = require("../depends/utils");
const { spawn } = require("child_process");
const { SUCCESS } = require("../constant");
const { randomBytes } = require("crypto");

const createPrivateKey = utils.createPrivateKey;
const publicToAddress = utils.publicToAddress;
const privateToPublic = utils.privateToPublic;

/*
 * @param {String} url ex "http://123.157.68.243:10011"
 * @param {String} address ex "21d21b68ded27ce2ef619651d382892c1f77baa4"
 * @return {Object} 
 *   @prop {Buffer} balance
 *   @prop {Buffer} nonce
 */
module.exports.getAccountInfo = async (url, address) => {
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

      const account = new Account(Buffer.from(data, "hex"));

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
module.exports.generateTx = (privateKey, nonce, to, value) => {
  assert(`generateTx, privateKey should be a Hex String, now is ${typeof privateKey}`);
  assert(`generateTx, nonce should be a Hex String, now is ${typeof nonce}`);
  assert(`generateTx, to should be a Hex String, now is ${typeof to}`);
  assert(`generateTx, value should be a Hex String, now is ${typeof value}`);

  // init tx
  const transaction = new Transaction({
    nonce: Buffer.from(nonce, "hex"),
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
module.exports.generateRandomTx = () => {
  // init from private
  const privateKeyFrom = createPrivateKey();

  // init to Address
  const privateKeyTo = createPrivateKey();
  const publicKeyTo = privateToPublic(privateKeyTo);
  const addressTo = publicToAddress(publicKeyTo);

  // init tx
  const nonce = randomBytes(1) | 0x01;
  const value = randomBytes(1) | 0x01;
  const transaction = new Transaction({
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

/*
 * @param {String} url ex "http://123.157.68.243:10011"
 * @param {String} tx
 * @return {Object} 
 *   @prop {String} balance
 *   @prop {String} nonce
 */
module.exports.sendTransaction = async (url, tx) => {
  assert(typeof url === "string", `sendTransaction, url should be a String, now is ${typeof url}`);
  assert(typeof tx === "string", `sendTransaction, tx should be a String, now is ${typeof tx}`);

  const curl = spawn("curl", ["-H", "Content-Type:application/json", "-X", "POST", "--data", `{"tx": "${tx}"}`, `${url}/sendTransaction`]);

  const sucDataArray = []
  const errDataArray = []

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

      const { code, data, msg } = JSON.parse(Buffer.concat(sucDataArray).toString());
      if(code !== SUCCESS)
      {
        reject(`sendTransaction, throw exception, ${msg}`)
      }

      resolve();
    });
  })
  
  return await promise;
}