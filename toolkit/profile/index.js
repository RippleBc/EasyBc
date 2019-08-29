const keyPiar = require("./keyPiar.json");
const { fork } = require('child_process');
const path = require("path");
const utils = require("../../depends/utils");
const slog = require("single-line-log").stdout;
const assert = require("assert");

const BN = utils.BN;

const g_exitedProcess = [];
const g_totalProcessedTxNumBN = new BN();

const now = Date.now();
const printInfo = () => {
  const elapsedSecondsBN = new BN().addn(Math.round((Date.now() - now) / 1000));
  const tps = g_totalProcessedTxNumBN.divRound(elapsedSecondsBN);

  slog(`total txs: ${g_totalProcessedTxNumBN.toString('hex')}\ntx num per second: ${tps}\nexited child process: ${g_exitedProcess.map(el => {
    return `\nindex: ${el.index},\nerr: ${el.err}`
  })}\n`);
}

/**
 * @param {Array} urls
 * @param {Number} range
 * @param {Number} total
 */
module.exports = async (urls, range, total) => {
  assert(Array.isArray(urls), `profile, urls should be an Array, now is ${typeof urls}`);
  assert(typeof range === 'number', `profile, range should be an Number, now is ${typeof range}`);
  assert(typeof total === 'number', `profile, total should be an Number, now is ${typeof total}`);

  const mainChild = fork(path.join(__dirname, "./startProfile"));
  mainChild.send({
    urls: urls,
    selfKeyPairs: [{
      privateKey: "ed09a7280c5a0d3c04839ca5603fe507b4d1d4572601e62aadafd923f55f7bf9",
      address: "21d21b68ded27ce2ef619651d382892c1f77baa4"
    }],
    targetKeyPairs: keyPiar.slice(0, range),
    value: "0100"
  });
  mainChild.on("message", ({ err, processedTxNum }) => {
    if (!!err) {
      g_exitedProcess.push({
        index: 'main',
        err: err
      });
    }

    if (processedTxNum) {
      g_totalProcessedTxNumBN.iaddn(processedTxNum);
    }

    printInfo();
  });
  console.info('child process main begin')

  for (let i = 0; i < keyPiar.length && i < total; i += range)
  {
    const child = fork(path.join(__dirname, "./startProfile"));
    child.send({
      urls: urls,
      selfKeyPairs: keyPiar.slice(i, i + range),
      targetKeyPairs: [...keyPiar.slice(0, i), ...keyPiar.slice(i + range, keyPiar.length)],
      value: "01"
    });
    child.on("message", ({ processedTxNum, err }) => {
      if(!!err)
      {
        g_exitedProcess.push({
          index: i / range,
          err: err
        });
      }

      if(processedTxNum)
      {
        g_totalProcessedTxNumBN.iaddn(processedTxNum);
      }

      printInfo();
    });

    console.info(`child process ${i / range} begin`)
  }
}