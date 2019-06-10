// ab -n 100 -c 2 -p transaction.json -T application/json http://123.157.68.243:10048/generateKeyPiar

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
const getFromAccountInfo = async (url, address) => {
  assert(typeof address === "string", `getFromAccountInfo, address should be a String, now is ${typeof address}`);
  assert(typeof url === "string", `getFromAccountInfo, url should be a String, now is ${typeof url}`);

  const curl = spawn("curl", ["-H", "Content-Type:application/json", "-X", "POST", "--data", `{"address": "${address}"}`, `${url}/getAccountInfo`]);

  const returnDataQeueu = []
  const errDataQueue = []

  curl.stdout.on('data', data => {
    returnDataQeueu.push(data);
  });

  curl.stderr.on('data', data => {
    errDataQueue.push(data);
  });

  const promise =  new Promise((resolve, reject) => {
    curl.on('close', exitCode => {
      if(exitCode !== 0) {
        reject(`curl 进程退出，退出码 ${exitCode}`);
      }

      const { code, data, msg } = JSON.parse(Buffer.concat(returnDataQeueu).toString());
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

// getFromAccountInfo("http://123.157.68.243:10011", "21d21b68ded27ce2ef619651d382892c1f77baa4").then(({nonce, balance}) => {
//   console.log(nonce.toString("hex"))
//   console.log(balance.toString("hex"))
// }).catch(e => {
//   console.error("******************err: " + e)
// })

// getFromAccountInfo("http://123.157.68.243:10011", "37faf6b0dd1c4faa396f975ffd350e25e8036bc7").then(({nonce, balance}) => {
//   console.log(nonce.toString("hex"))
//   console.log(balance.toString("hex"))
// }).catch(e => {
//   console.error("******************err: " + e)
// })

const sendTransaction = async (url, privateKey, to) => {
  const ab = spawn("ab", ["-n", "100", "-c", "2", "-p", "txData.json", "-T", "application/json", "http://123.157.68.243:10048/generateKeyPiar"]);

  ab.stdout.on('data', data => {
    console.log(data.toString());
  });

  ab.stderr.on('data', data => {
    console.log(`ab stderr: ${data}`);
  });

  ab.on('close', code => {
    if (code !== 0) {
      console.log(`ab 进程退出，退出码 ${code}`);
    }
  });
}



