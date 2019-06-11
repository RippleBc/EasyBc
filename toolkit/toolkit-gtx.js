#!/usr/bin/env node

// node toolkit/toolkit.js gtx -t ed09a7280c5a0d3c04839ca5603fe507b4d1d4572601e62aadafd923f55f7bf9,01,37faf6b0dd1c4faa396f975ffd350e25e8036bc7,01

const program = require("commander");
const utils = require("../depends/utils");
const Transaction = require("../depends/transaction");
const assert = require("assert");
const { generateRandomTx, generateTx } = require("./utils");

const Buffer = utils.Buffer;

program
  .version("0.1.0")
  .option("-r, --random", "generate random transaction")
  .option("-t, --transaction-info <transactionInfo>", "transaction info, format: '<privateKey>,<nonce>,<to>,<value>'")
  .action(options => {

    let txRaw;

    if(options.random)
    {
      txRaw = generateRandomTx();
    }
    else
    {
      const [privateKey, nonce, to, value] = options.transactionInfo.split(',');

      txRaw = generateTx(privateKey, nonce, to, value);
    }

    console.warn(`tx: ${txRaw}`);
  });

program.parse(process.argv);