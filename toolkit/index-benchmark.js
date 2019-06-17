#!/usr/bin/env node

const program = require("commander");
const benchmark = require("./benchmark");

// node toolkit/index.js benchmark -n 100000
program
  .version("0.1.0")
  .option("-n, --num <num>", "content size(bytes), default is 250")
  .action(options => {
    benchmark(options.num ? parseInt(options.num) : 250);
  });

program.parse(process.argv);