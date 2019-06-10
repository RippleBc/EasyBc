#!/usr/bin/env node

// node toolkit/toolkit.js gtx -t ed09a7280c5a0d3c04839ca5603fe507b4d1d4572601e62aadafd923f55f7bf9,01,37faf6b0dd1c4faa396f975ffd350e25e8036bc7,01

const program = require("commander");
const utils = require("../depends/utils");
const Transaction = require("../depends/transaction");
const assert = require("assert");

const Buffer = utils.Buffer;
const createPrivateKey = utils.createPrivateKey;
const publicToAddress = utils.publicToAddress;
const privateToPublic = utils.privateToPublic;

program
  .version("0.1.0")
  .option("-r, --random", "generate random transaction")
  .option("-t, --transaction-info <transactionInfo>", "transaction info, format: '<privateKey>,<nonce>,<to>,<value>'")
  .action(options => {
    if(!options.random)
    {
      const [privateKey, nonce, to, value] = options.transactionInfo.split(',');

      assert(`gtx, privateKey should be a Hex String, now is ${typeof privateKey}`);
      assert(`gtx, nonce should be a Hex String, now is ${typeof nonce}`);
      assert(`gtx, to should be a Hex String, now is ${typeof to}`);
      assert(`gtx, value should be a Hex String, now is ${typeof value}`);

      // init tx
      const transaction = new Transaction({
        nonce: Buffer.from(nonce, "hex"),
        to: Buffer.from(to, "hex"),
        value: Buffer.from(value, "hex")
      })

      // sign
      transaction.sign(Buffer.from(privateKey, "hex"));

      console.warn(`tx: ${transaction.serialize().toString("hex")}`);
    }
    else
    {
      // init from private
      const privateKeyFrom = createPrivateKey();

      // init to Address
      const privateKeyTo = createPrivateKey();
      const publicKeyTo = privateToPublic(privateKeyTo);
      const addressTo = publicToAddress(publicKeyTo);

      // init tx
      const transaction = new Transaction({
        nonce: Buffer.from("01", "hex"),
        to: addressTo,
        value: Buffer.from("01", "hex")
      });

      // sign
      transaction.sign(privateKeyFrom);

      console.warn(`tx: ${transaction.serialize().toString("hex")}`);
    }
  });

program.parse(process.argv);