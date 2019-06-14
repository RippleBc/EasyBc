const { sendTransaction } = require("./transaction");

module.exports = (url, num, concurrent) => {
  sendTransaction(url, num, concurrent).then((abTestSuccessResult, abTestErrorResult) => {
    console.log(abTestSuccessResult)
  }).catch(e => {
    console.error(`ab test failed, ${e.stack ? e.stack : e.toString()}`);
  });
}
