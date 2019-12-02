#!/usr/bin/env node

const program = require("commander");
const config = require("./config");

// node toolkit/index.js config -c '{"processIndex": 0, "dbIndex": 0,"privateKey":"bfd549bfbbb41498b290bfdbefc1810aacf83463ba949569975220b3ceaaa1e0","p2pProxyOpen":false}'
// node toolkit/index.js config -c '{"processIndex": 1, "dbIndex": 1,"privateKey":"e29f99d13a92f788e46cec235ffbde9e64360bd1bd9e68e18ecac2e433fd6fce","p2pProxyOpen":false}'
// node toolkit/index.js config -c '{"processIndex": 2, "dbIndex": 2,"privateKey":"a8ae1cedfe4cde02f45df6cf684a5612f59e110b29bbbeeec5e5886e6d2a6c0c","p2pProxyOpen":false}'
// node toolkit/index.js config -c '{"processIndex": 3, "dbIndex": 3,"privateKey":"c579cce6ddb05ea154369a4bbe5d56a2ecd4f94916207751541a204bca6c608f","p2pProxyOpen":false}'
program
    .version("0.1.0")
    .option("-c, --command <mode>", "command")
    .action(options => {

        const commandJSON = JSON.parse(options.command.replace(/(\r\n)|\r|\n|\t|\s/g, ''));

        console.log(`command: ${JSON.stringify(commandJSON, null, '\t')}\n`);

        config(commandJSON);
    });

program.parse(process.argv);