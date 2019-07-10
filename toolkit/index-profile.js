#!/usr/bin/env node

const program = require("commander");
const profile = require("./profile");

// node toolkit/index.js profile -u http://123.157.68.243:10011,http://123.157.68.243:10051,http://115.233.227.46:35003,http://115.233.227.46:35008 -n 100
// node toolkit/index.js profile -u http://localhost:8081 -n 100
// node toolkit/index.js profile -u http://localhost:8081,http://localhost:8084,http://localhost:8086 -n 100
program
  .version("0.1.0")
  .option("-u, --urls <urls>", "urls info")
  .option("-n, --num <num>", "transaction num")
  .action(options => {
    const urls = options.urls.split(',');
    const num = parseInt(options.num);

    console.log(`urls: ${urls}`)
    console.log(`transactions num: ${num}`)

    profile(urls, num).catch(e => {
      console.error(`calculate transaction consensus limit failed, ${e.stack ? e.stack : e.toString()}`)
    });
  });

program.parse(process.argv);