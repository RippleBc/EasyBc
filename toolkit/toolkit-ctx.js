#!/usr/bin/env node

// node toolkit/toolkit.js ctx -u http://123.157.68.243:10011,http://123.157.68.243:10051,http://115.233.227.46:35003,http://115.233.227.46:35008 -n 100

const program = require("commander");
const utils = require("../depends/utils");
const { generateRandomTx, generateTx, getAccountInfo, sendTransaction } = require("./utils");
const ProgressBar = require("../depends/progress_bar");

const BN = utils.BN;

program
  .version("0.1.0")
  .option("-u, --urls <urls>", "urls info")
  .option("-n, --num <num>", "transaction num")
  .action(options => {

    const urls = options.urls.split(',');
    const num = parseInt(options.num);

    let completed = 0;
    const total = num * urls.length;
    const pb = new ProgressBar("tx comsensus limit test", 50);

    (async () => {
      // get account info
      const tx_from = "21d21b68ded27ce2ef619651d382892c1f77baa4";
      const tx_to = "37faf6b0dd1c4faa396f975ffd350e25e8036bc7";
      const { nonce: nonceFrom, balance: balanceFrom } = await getAccountInfo(urls[0], tx_from)
      const { nonce: nonceTo, balance: balanceTo } = await getAccountInfo(urls[0], tx_to)

      console.info(`tx_from: ${tx_from}, nonce: ${nonceFrom.toString("hex")}, balance: ${balanceFrom.toString("hex")}`)
      console.info(`tx_from: ${tx_to}, nonce: ${nonceTo.toString("hex")}, balance: ${balanceTo.toString("hex")}`)

      for(let i = 0; i < num - 1; i++)
      {
        // send transaction
        let sendTransactionPromises = [];
        for(let url of urls)
        {
          // generate tx raw
          const txRaw = generateRandomTx(); 
          sendTransaction(url, txRaw).then(() => {
            // update progress
            pb.render(++completed, total);
          }).catch(e => {
            console.error(`sendTransaction throw exception, ${e}`);
          });
        }
      }

      // init tx
      const tx_privateKeyFrom = "ed09a7280c5a0d3c04839ca5603fe507b4d1d4572601e62aadafd923f55f7bf9";
      const tx_nonce = (new BN(nonceFrom).iaddn(1)).toString("hex");
      const tx_value = "01"
      const txRaw = generateTx(tx_privateKeyFrom, tx_nonce, tx_to, tx_value);

      // send transaction
      let sendTransactionPromises = [];
      for(let url of urls)
      {
        sendTransactionPromises.push(sendTransaction(url, txRaw));
      }
      await Promise.all(sendTransactionPromises);

      // update progress
      completed += 4;
      pb.render(completed, total);
    })().then(() => {
    }).catch(e => {
      console.error(`calculate transaction consensus limit failed, ${e}`)
    })
  });

program.parse(process.argv);