#!/usr/bin/env node

const program = require("commander");
const profile = require("./profile");

// node toolkit/index.js profile -u http://123.157.68.243:10011,http://123.157.68.243:10051,http://115.233.227.46:35003,http://115.233.227.46:35008 -r 50 -t 200
// node toolkit/index.js profile -u http://localhost:8081 -r 50 -t 200
// node toolkit/index.js profile -u http://localhost:8081,http://localhost:8181,http://localhost:8281 -r 50 -t 200
// node toolkit/index.js profile -u http://123.157.68.243:10011,http://123.157.68.243:10051,http://115.233.227.46:35003  -r 50 -t 200
program
  .version("0.1.0")
  .option("-u, --urls <urls>", "urls info")
  .option("-r, --range <range>", "step range")
  .option("-t, --total <total>", "total")
  .action(options => {
    const urls = options.urls.split(',');

    console.info(`urls: ${urls}, range: ${options.range}, total: ${options.total}`);

    profile(urls, parseInt(options.range), parseInt(options.total)).catch(e => {
      console.error(`calculate transaction consensus limit failed, ${e.stack ? e.stack : e.toString()}`)
    });
  });

program.parse(process.argv);