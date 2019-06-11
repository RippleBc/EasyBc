#!/usr/bin/env node

const program = require("commander");
const utils = require("../depends/utils");

const createPrivateKey = utils.createPrivateKey;
const publicToAddress = utils.publicToAddress;
const privateToPublic = utils.privateToPublic;

program
  .version("0.1.0")
  .action(options => {
    
  });

program.parse(process.argv);