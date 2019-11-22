#!/usr/bin/env node

const program = require("commander");
const p2p = require("./p2p");

// node toolkit/index.js p2p -m proxy
program
    .version("0.1.0")
    .option("-m, --mode <mode>", "p2p mode")
    .action(options => {

        console.info(`mode: ${options.mode}`);

        p2p(options.mode);
    });

program.parse(process.argv);