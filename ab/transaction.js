// ab -n 100 -c 2 -p transaction.json -T application/json http://123.157.68.243:10048/generateKeyPiar

// curl -H Content-Type:application/json -X POST --data '{"tx": "f8620186016b4fea490d9437faf6b0dd1c4faa396f975ffd350e25e8036bc701801ba0f1df582bce40c9d35cf860acbdd8400bf6ef0d36b53283a86a5e6a15a6604c6aa02e9d92d6e990708359abefdace8fa52f69c8bcd582db1936f54d84c22628aa64"}' http://123.157.68.243:10011/sendTransaction
const assert = require("assert");
const { spawn } = require("child_process");
const ProgressBar = require('../depends/progress_bar');

/*
 * @param {String} url
 * @return {String} the report of ab test
 */
const sendTransaction = async url => {
  assert(typeof url === "string", `sendTransaction, url should be a String, now is ${typeof url}`);

  let total = 100;
  let completed = 0;

  const pb = new ProgressBar('ab test progress', 50);

  const ab = spawn("ab", ["-n", "500", "-c", "10", "-p", "txData.json", "-T", "application/json", `${url}/sendTransaction`]);

  const interval = setInterval(() => {
    completed += 1;
    pb.render(completed, total);
  }, 500).unref();

  const sucDataArray = [];
  const errDataArray = [];

  ab.stdout.on('data', data => {
    completed += 1;
    pb.render(completed, total);

    sucDataArray.push(data);
  });

  ab.stderr.on('data', data => {
    errDataArray.push(data);
  });

  return await new Promise((resolve, reject) => {
    ab.on('close', code => {
      clearInterval(interval);

      if(code !== 0) {
        reject(`ab 进程退出，退出码 ${code}`);
      }

      completed = total;
      pb.render(completed, total);

      const abTestSuccessResult = Buffer.concat(sucDataArray).toString();
      const abTestErrorResult = Buffer.concat(errDataArray).toString();

      resolve(abTestSuccessResult, abTestErrorResult);
    });
  });
}

sendTransaction("http://123.157.68.243:10011").then((abTestSuccessResult, abTestErrorResult) => {
  console.log(abTestSuccessResult)
}).catch(e => {
  console.error(`ab test failed, ${e}`);
});