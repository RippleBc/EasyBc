#!/usr/bin/env node

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
  .option("-p, --privateKey <privateKey>", "specified privateKey")
  .option("-n, --nonce <nonce>", "specified privateKey")
  .option("-t, --to <to>", "specified privateKey")
  .option("-v, --value <value>", "specified privateKey")
  .action(options => {
    if(!options.random)
    {
      const privateKey = options.privateKey;
      const nonce = options.nonce;
      const to = options.to;
      const value = options.value;

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


// node toolkit/toolkit.js gtx -p ed09a7280c5a0d3c04839ca5603fe507b4d1d4572601e62aadafd923f55f7bf9 -n 01 -t 37faf6b0dd1c4faa396f975ffd350e25e8036bc7 -v 01