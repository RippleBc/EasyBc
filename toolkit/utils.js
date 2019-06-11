const assert = require("assert");
const Account = require("../depends/account");
const { spawn } = require("child_process");
const { SUCCESS } = require("../constant");

/*
 * @param {String} url
 * @param {String} address
 * @return {Object} 
 *   @prop {String} balance
 *   @prop {String} nonce
 */
module.exports.getFromAccountInfo = async (url, address) => {
  assert(typeof address === "string", `getFromAccountInfo, address should be a String, now is ${typeof address}`);
  assert(typeof url === "string", `getFromAccountInfo, url should be a String, now is ${typeof url}`);

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
        reject(`curl 进程退出，退出码 ${exitCode}`);
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

// const address = "21d21b68ded27ce2ef619651d382892c1f77baa4";
// const {nonce, balance} = await getFromAccountInfo("http://123.157.68.243:10011", address);
// console.log(`address: ${address}, nonce: ${nonce.toString("hex")}, balance: ${balance.toString("hex")}`);