const keyPiar = require("./keyPiar.json");
const { fork } = require('child_process');
const path = require("path");
const utils = require("../../depends/utils");
const slog = require("single-line-log").stdout;
const assert = require("assert");

const BN = utils.BN;

// processec txs num each process
const g_childProcessedTxNumBNArray = [];

// total processed txs num
const g_totalProcessedTxNumBN = new BN();

//
const allChildProcesses = [];

//
process.on("uncaughtException", function (err) {
  console.error(err);

  // terminate child process
  for (let childProcess of allChildProcesses) {
    childProcess.kill()
  }

  //
  setTimeout(() => {
    console.info(`exitTime: ${new Date().toString()}`);
    
    process.exit(1);
  }, 5000);
});


const now = Date.now();
const printInfo = () => {
  const elapsedSeconds = Math.round((Date.now() - now) / 1000);

  let tps = new BN();
  if (elapsedSeconds)
  {
    tps = g_totalProcessedTxNumBN.divn(elapsedSeconds);
  }
  

  const info = `total txs: ${ g_totalProcessedTxNumBN.toString('hex') }\ntx num per second: ${ tps }\nchild processed tx num: \n${ g_childProcessedTxNumBNArray.map((el, index) => `process ${index}, url: ${el.url} num: ${el.txNum.toString('hex')}, time: ${el.consumedTime}\n`).join('')}`;

  slog(info);
}

/**
 * @param {Array} urls
 * @param {Number} range
 * @param {Number} total
 * @param {Boolean} validate
 */
module.exports = async (urls, range, total, validate) => {
  assert(Array.isArray(urls), `profile, urls should be an Array, now is ${typeof urls}`);
  assert(typeof range === 'number', `profile, range should be an Number, now is ${typeof range}`);
  assert(typeof total === 'number', `profile, total should be an Number, now is ${typeof total}`);
  assert(typeof validate === 'boolean', `profile, validate should be an Boolean, now is ${typeof validate}`);

  const traverseAddressNum = keyPiar.length > total ? total : keyPiar.length;

  //
  const allProcessArgs = [{
    url: urls[0],
    selfKeyPairs: [{
      privateKey: "9d6ae99d516fec86d7c922d2b3b455205b25cc65d2467d8ecbc47d513cba3841",
      address: "21d21b68ded27ce2ef619651d382892c1f77baa4"
    }],
    targetKeyPairs: keyPiar.slice(0, traverseAddressNum),
    value: "0100",
    validate
  }];

  //
  for (let i = 0; i < traverseAddressNum; i += range) {
    allProcessArgs.push({
      url: urls[parseInt(i / range) % urls.length],
      selfKeyPairs: keyPiar.slice(i, i + range),
      targetKeyPairs: [...keyPiar.slice(0, i), ...keyPiar.slice(i + range, traverseAddressNum)],
      value: "01",
      validate
    });
  }

  // fork child process
  for(let i = 0; i < allProcessArgs.length; i++)
  {
    //
    g_childProcessedTxNumBNArray[i] = {
      txNum: new BN(),
      consumedTime: 0,
      url: allProcessArgs[i].url
    };

    //
    const child = fork(path.join(__dirname, "./startProfile"));
    
    //
    allChildProcesses.push(child);

    //
    child.send(allProcessArgs[i]);
    child.on("message", ({ processedTxNum, consumedTime, err }) => {
      if (!!err) {
        console.error(`index: ${i}, consumedTime: ${consumedTime}, err: ${err}`);
        
        // terminate child process
        for (let childProcess of allChildProcesses)
        {
          childProcess.kill()
        }
          
        //
        setTimeout(() => {
          
          console.info(`exitTime: ${new Date().toString()}`);

          process.exit(1);
        }, 5000);

        return;
      }

      if (processedTxNum) {
        g_childProcessedTxNumBNArray[i].txNum.iaddn(processedTxNum);
        g_childProcessedTxNumBNArray[i].consumedTime = consumedTime;

        //
        g_totalProcessedTxNumBN.iaddn(processedTxNum);
      }

      printInfo();
    });
  }
}