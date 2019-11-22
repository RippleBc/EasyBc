#!/usr/bin/env node

const program = require("commander");
const config = require("./config");

// node toolkit/index.js config -c '{"index": 1,"privateKey":"e29f99d13a92f788e46cec235ffbde9e64360bd1bd9e68e18ecac2e433fd6fce","p2pProxyOpen":true}'
// node toolkit/index.js config -c '{"index": 2,"privateKey":"a8ae1cedfe4cde02f45df6cf684a5612f59e110b29bbbeeec5e5886e6d2a6c0c","p2pProxyOpen":true}'
// node toolkit/index.js config -c '{"index": 3,"privateKey":"c579cce6ddb05ea154369a4bbe5d56a2ecd4f94916207751541a204bca6c608f","p2pProxyOpen":true}'
program
    .version("0.1.0")
    .option("-c, --command <mode>", "command")
    .action(options => {

        const commandJSON = JSON.parse(options.command.replace(/(\r\n)|\r|\n|\t|\s/g, ''));

        console.log(`command: ${JSON.stringify(commandJSON, null, '\t')}`);

        config(commandJSON);
    });

program.parse(process.argv);