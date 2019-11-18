const keyPiar = require("./keyPiar.json");
const { fork } = require('child_process');
const path = require("path");
const utils = require("../../depends/utils");
const slog = require("single-line-log").stdout;
const assert = require("assert");

const BN = utils.BN;

//
const g_exitedProcess = [];

// processec txs num each process
const g_childProcessedTxNumBNArray = [];

// total processed txs num
const g_totalProcessedTxNumBN = new BN();

const now = Date.now();
const printInfo = () => {
  const elapsedSecondsBN = new BN().addn(Math.round((Date.now() - now) / 1000));
  const tps = g_totalProcessedTxNumBN.divRound(elapsedSecondsBN);

  slog(`total txs: ${g_totalProcessedTxNumBN.toString('hex')}\ntx num per second: ${tps}\nchild processed tx num:\n${g_childProcessedTxNumBNArray.map((el, index) => {
    if (index === 0) {
      return `main: ${el.txNum.toString('hex')}, ${el.consumedTime}\n`
    }
    else {
      return `child ${index}: ${el.txNum.toString('hex')}, ${el.consumedTime}\n`
    }
  }).join('')}exited child process:\n${g_exitedProcess.map(el => {
    return `index: ${el.index}, consumedTime: ${el.consumedTime}, err: ${el.err}\n`
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

  //
  const allProcessArgs = [{
    url: urls[0],
    selfKeyPairs: [{
      privateKey: "ed09a7280c5a0d3c04839ca5603fe507b4d1d4572601e62aadafd923f55f7bf9",
      address: "21d21b68ded27ce2ef619651d382892c1f77baa4"
    }],
    targetKeyPairs: keyPiar.slice(0, traverseAddressNum),
    value: "0100"
  }];

  //
  for (let i = 0; i < traverseAddressNum; i += range) {
    allProcessArgs.push({
      url: urls[parseInt(i / range) % urls.length],
      selfKeyPairs: keyPiar.slice(i, i + range),
      targetKeyPairs: [...keyPiar.slice(0, i), ...keyPiar.slice(i + range, traverseAddressNum)],
      value: "01"
    });
  }

  // fork child process
  for(let i = 0; i < allProcessArgs.length; i++)
  {
    const child = fork(path.join(__dirname, "./startProfile"));
    
    child.send(allProcessArgs[i]);
    child.on("message", ({ processedTxNum, consumedTime, err }) => {
      if (!!err) {
        g_exitedProcess.push({
          index: i,
          consumedTime: consumedTime,
          err: err
        });
      }

      if (processedTxNum) {
        //
        if (!g_childProcessedTxNumBNArray[i]) {
          g_childProcessedTxNumBNArray[i] = {
            txNum: new BN(),
            consumedTime: 0
          };
        }
        g_childProcessedTxNumBNArray[i].txNum.iaddn(processedTxNum);
        g_childProcessedTxNumBNArray[i].consumedTime = consumedTime;

        //
        g_totalProcessedTxNumBN.iaddn(processedTxNum);
      }

      printInfo();
    });

    //
    console.info(`child process ${i} begin`);
  }
}