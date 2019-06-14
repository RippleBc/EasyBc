#!/usr/bin/env node

const program = require("commander");
const utils = require("../depends/utils");

const createPrivateKey = utils.createPrivateKey;
const publicToAddress = utils.publicToAddress;
const privateToPublic = utils.privateToPublic;

program
  .version("0.1.0")
  .option("-p, --public", "generate public key")
  .option("-a, --address", "generate address")
  .action(options => {
    const privateKey = createPrivateKey();
    console.warn(`privateKey: ${privateKey.toString("hex")}`);

    const publicKey = privateToPublic(privateKey);
    const address = publicToAddress(publicKey);

    if(options.public)
    {
      return console.warn(`publicKey: ${publicKey.toString("hex")}`);
    }

    if(options.address)
    {
      return console.warn(`address: ${address.toString("hex")}`);
    }
    
    console.warn(`publicKey: ${publicKey.toString("hex")}`);
    console.warn(`address: ${address.toString("hex")}`);
  });

program.parse(process.argv);