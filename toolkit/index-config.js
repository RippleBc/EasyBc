#!/usr/bin/env node

const program = require("commander");
const config = require("./config");

// node toolkit/index.js config -c '{"index": 0,"privateKey":"e29f99d13a92f788e46cec235ffbde9e64360bd1bd9e68e18ecac2e433fd6fce","p2pProxyOpen":true}'
program
    .version("0.1.0")
    .option("-c, --command <mode>", "command")
    .action(options => {

        const commandJSON = JSON.parse(options.command.replace(/(\r\n)|\r|\n|\t|\s/g, ''));

        console.log(`command: ${JSON.stringify(commandJSON, null, '\t')}`);

        config(commandJSON);
    });

program.parse(process.argv);