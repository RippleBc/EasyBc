#!/usr/bin/env node

const program = require("commander");
const ab = require("./ab");

// node toolkit/index.js ab -u http://123.157.68.243:10011 -n 500 -c 4
program
  .version("0.1.0")
  .option("-u, --url <url>", "target url")
  .option("-n, --num <num>", "total request num")
  .option("-c, --concurrent <concurrent>", "concurrent client num")
  .action(options => {
    const url = options.url;
    const num = parseInt(options.num);
    const concurrent = parseInt(options.concurrent);

    console.log(`url, ${url}`)
    console.log(`num, ${num}`)
    console.log(`concurrent, ${concurrent}`)
    
    ab(url, num, concurrent);
  });

program.parse(process.argv);