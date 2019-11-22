#!/usr/bin/env node

const program = require("commander");
const config = require("./config");

// node toolkit/index.js config -m proxy
program
    .version("0.1.0")
    .option("-c, --command <mode>", "command")
    .action(options => {

        const commandJSON = JSON.parse(options.command.replace(/(\r\n)|\r|\n|\t|\s/g, ''));

        config(commandJSON);
    });

program.parse(process.argv);