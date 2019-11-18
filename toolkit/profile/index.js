const keyPiar = require("./keyPiar.json");
const { fork } = require('child_process');
const path = require("path");
const utils = require("../../depends/utils");
const slog = require("single-line-log").stdout;
const assert = require("assert");

const BN = utils.BN;

const g_exitedProcess = [];
const g_childProcessedTxNumBNArray = [];
const g_totalProcessedTxNumBN = new BN();

const now = Date.now();
const printInfo = () => {
  const elapsedSecondsBN = new BN().addn(Math.round((Date.now() - now) / 1000));
  const tps = g_totalProcessedTxNumBN.divRound(elapsedSecondsBN);

  slog(`total txs: ${g_totalProcessedTxNumBN.toString('hex')}\ntx num per second: ${tps}\nchild processed tx num:\n${g_childProcessedTxNumBNArray.map((el, index) => {
    if (index === 0) {
      return `main: ${el.toString('hex')}\n`
    }
    else {
      return `child ${index}: ${el.toString('hex')}\n`
    }
  }).join('')}exited child process:\n${g_exitedProcess.map(el => {
    return `index: ${el.index}, err: ${el.err}\n`
  }).join('')}`);
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

  const traverseAddressNum = keyPiar.length > total ? total : keyPiar.length;

  // send token from super account to other accounts
  const mainChild = fork(path.join(__dirname, "./startProfile"));
  mainChildArgs = {
    urls: urls,
    selfKeyPairs: [{
      privateKey: "ed09a7280c5a0d3c04839ca5603fe507b4d1d4572601e62aadafd923f55f7bf9",
      address: "21d21b68ded27ce2ef619651d382892c1f77baa4"
    }],
    targetKeyPairs: keyPiar.slice(0, traverseAddressNum),
    value: "0100"
  };
  mainChild.send(mainChildArgs);
  mainChild.on("message", ({ err, processedTxNum }) => {
    if (!!err) {
      g_exitedProcess.push({
        index: 'main',
        err: err
      });
    }

    if (processedTxNum) {
      if (!g_childProcessedTxNumBNArray[0]) {
        g_childProcessedTxNumBNArray[0] = new BN();
      }
      g_childProcessedTxNumBNArray[0].iaddn(processedTxNum);

      g_totalProcessedTxNumBN.iaddn(processedTxNum);
    }

    printInfo();
  });
  console.info('process main begin')

  // random send token
  for (let i = 0; i < traverseAddressNum; i += range) {
    const child = fork(path.join(__dirname, "./startProfile"));
    const childArgs = {
      urls: urls,
      selfKeyPairs: keyPiar.slice(i, i + range),
      targetKeyPairs: [...keyPiar.slice(0, i), ...keyPiar.slice(i + range, traverseAddressNum)],
      value: "01"
    };

    child.send(childArgs);
    child.on("message", ({ processedTxNum, err }) => {
      if (!!err) {
        g_exitedProcess.push({
          index: i / range + 1,
          err: err
        });
      }

      if (processedTxNum) {
        if (!g_childProcessedTxNumBNArray[i / range + 1]) {
          g_childProcessedTxNumBNArray[i / range + 1] = new BN();
        }
        g_childProcessedTxNumBNArray[i / range + 1].iaddn(processedTxNum);

        g_totalProcessedTxNumBN.iaddn(processedTxNum);
      }

      printInfo();
    });

    console.info(`child process ${i / range} begin`)
  }
}