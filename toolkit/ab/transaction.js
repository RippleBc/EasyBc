// ab -n 100 -c 2 -p transaction.json -T application/json http://123.157.68.243:10048/generateKeyPiar

// curl -H Content-Type:application/json -X POST --data '{"tx": "f8620186016b4fea490d9437faf6b0dd1c4faa396f975ffd350e25e8036bc701801ba0f1df582bce40c9d35cf860acbdd8400bf6ef0d36b53283a86a5e6a15a6604c6aa02e9d92d6e990708359abefdace8fa52f69c8bcd582db1936f54d84c22628aa64"}' http://123.157.68.243:10011/sendTransaction
const assert = require("assert");
const { spawn } = require("child_process");
const { LoadingBar } = require('../utils');

/*
 * @param {String} url
 * @param {Number} num
 * @param {Number} current
 * @return {String} the report of ab test
 */
module.exports.sendTransaction = async (url, num, concurrent) => {
  assert(typeof url === "string", `sendTransaction, url should be a String, now is ${typeof url}`);
  assert(typeof num === "number", `sendTransaction, num should be a Number, now is ${typeof num}`);
  assert(typeof concurrent === "number", `sendTransaction, concurrent should be a Number, now is ${typeof concurrent}`);

  const loadingBar = new LoadingBar();
  loadingBar.start();

  const ab = spawn("ab", ["-n", num, "-c", concurrent, "-p", "./toolkit/ab/txData.json", "-T", "application/json", `${url}/sendTransaction`]);

  const sucDataArray = [];
  const errDataArray = [];

  ab.stdout.on('data', data => {
    sucDataArray.push(data);
  });

  ab.stderr.on('data', data => {
    errDataArray.push(data);
  });

  return await new Promise((resolve, reject) => {
    ab.on('close', code => {
      loadingBar.end();

      if(code !== 0) {
        reject(`ab 进程退出，退出码 ${code}`);
      }

      const abTestSuccessResult = Buffer.concat(sucDataArray).toString();
      const abTestErrorResult = Buffer.concat(errDataArray).toString();

      resolve(abTestSuccessResult, abTestErrorResult);
    });
  });
}