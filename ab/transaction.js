// ab -n 100 -c 2 -p transaction.json -T application/json http://123.157.68.243:10048/generateKeyPiar

const assert = require("assert");
const { spawn } = require("child_process");
var ProgressBar = require('../depends/progress_bar');

/*
 * @param {String} url
 * @return {String} the report of ab test
 */
const sendTransaction = async url => {
  assert(typeof url === "string", `sendTransaction, url should be a String, now is ${typeof url}`);

  let total = 100;
  let completed = 0;

  const pb = new ProgressBar('ab test progress', 50);

  const ab = spawn("ab", ["-n", "1000", "-c", "2", "-p", "txData.json", "-T", "application/json", `${url}/sendTransaction`]);

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