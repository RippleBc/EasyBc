#!/usr/bin/env node

// node toolkit/toolkit.js ctx -u http://123.157.68.243:10011,http://123.157.68.243:10015,http://115.233.227.46:35003,http://115.233.227.46:35008 -n 200

const program = require("commander");
const utils = require("../depends/utils");
const { generateRandomTx, generateTx, getAccountInfo, sendTransaction } = require("./utils");

const BN = utils.BN;

program
  .version("0.1.0")
  .option("-u, --urls <urls>", "urls info")
  .option("-n, --num <num>", "transaction num")
  .action(options => {

    const urls = options.urls.split(',');
    const num = parseInt(options.num);

    (async () => {
      let sendTransactionPromises = [];

      const { nonce, balance } = await getAccountInfo(urls[0], "21d21b68ded27ce2ef619651d382892c1f77baa4")

      for(let i = 0; i < num; i++)
      {
        // generate tx raw
        const txRaw = generateRandomTx(); 

        // send transaction
        sendTransactionPromises = [];
        for(let url of urls)
        {
          sendTransactionPromises.push(sendTransaction(url, txRaw));
        }
        await Promise.all(sendTransactionPromises);

        console.info(`send transaction: ${txRaw} success`);
      }

      // init tx
      const tx_privateKeyFrom = "ed09a7280c5a0d3c04839ca5603fe507b4d1d4572601e62aadafd923f55f7bf9";
      const tx_nonce = (new BN(nonce).iaddn(1)).toString("hex");
      const tx_to = "37faf6b0dd1c4faa396f975ffd350e25e8036bc7";
      const tx_value = "01"
      const txRaw = generateTx(tx_privateKeyFrom, tx_nonce, tx_to, tx_value);

      // send transaction
      sendTransactionPromises = [];
      for(let url of urls)
      {
        sendTransactionPromises.push(sendTransaction(url, txRaw));
      }
      await Promise.all(sendTransactionPromises);

      console.info(`send transaction: ${txRaw} success`);

      await new Promise

    })().then(() => {
    }).catch(e => {
      console.error(`calculate transaction consensus limit failed, ${e}`)
    })
  });


const checkBalance(address, balance)

program.parse(process.argv);