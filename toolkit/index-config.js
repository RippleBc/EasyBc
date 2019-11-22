#!/usr/bin/env node

const program = require("commander");
const config = require("./config");

// node toolkit/index.js config -m proxy
program
    .version("0.1.0")
    .option("-m, --mode <mode>", "config mode")
    .action(options => {

        console.info(`mode: ${options.mode}`);

        config(options.mode);
    });

program.parse(process.argv);