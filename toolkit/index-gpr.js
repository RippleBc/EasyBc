const program = require("commander");
const utils = require("../depends/utils");

#!/usr/bin/env node

const createPrivateKey = utils.createPrivateKey;
const publicToAddress = utils.publicToAddress;
const privateToPublic = utils.privateToPublic;

program
  .version("0.1.0")
  .option("-p, --public", "generate public key")
  .option("-a, --address", "generate address")
  .action(cmd => {
    const privateKey = createPrivateKey();
    console.warn(`privateKey: ${privateKey.toString("hex")}`);

    const publicKey = privateToPublic(privateKey);
    const address = publicToAddress(publicKey);

    if(cmd.public)
    {
      return console.warn(`publicKey: ${publicKey.toString("hex")}`);
    }

    if(cmd.address)
    {
      return console.warn(`address: ${address.toString("hex")}`);
    }
    
    console.warn(`publicKey: ${publicKey.toString("hex")}`);
    console.warn(`address: ${address.toString("hex")}`);
  });

program.parse(process.argv);