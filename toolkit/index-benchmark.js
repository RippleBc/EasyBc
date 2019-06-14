#!/usr/bin/env node

const program = require("commander");
const benchmark = require("./benchmark");

program
  .version("0.1.0")
  .action(options => {
    benchmark();
  });

program.parse(process.argv);