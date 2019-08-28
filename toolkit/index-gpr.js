#!/usr/bin/env node

const program = require("commander");
const utils = require("../depends/utils");
const fs = require("fs");
const path = require("path");

const createPrivateKey = utils.createPrivateKey;
const publicToAddress = utils.publicToAddress;
const privateToPublic = utils.privateToPublic;

const generateKeyPiar = function (options, keyPiarWriteStream) {
  const privateKey = createPrivateKey();

  keyPiarWriteStream.write(`\t\t"privateKey": "${privateKey.toString("hex")}",\n`);

  const publicKey = privateToPublic(privateKey);
  const address = publicToAddress(publicKey);

  keyPiarWriteStream.write(`\t\t"publicKey": "${publicKey.toString("hex")}",\n`);
  keyPiarWriteStream.write(`\t\t"address": "${address.toString("hex")}",\n`);
}

program
  .version("0.1.0")
  .option("-n, --number <number>", "generate number")
  .action(options => {
    let running = true;
    const keyPiarWriteStream = fs.createWriteStream(path.join(__dirname, "./profile/keyPiar.json"))

    keyPiarWriteStream.on('drain', () => {
      running = true
    })

    keyPiarWriteStream.on('error', e => {
      console.fatal(e);
      process.exit(1);
    });

    keyPiarWriteStream.write("{\n");

    (async () => {
      let i = 0;
      while (i < options.number) {
        if (!running) {
          await new Promise(resolve => {
            setTimeout(() => {
              resolve();
            }, 1000);
          })

          continue;
        }

        keyPiarWriteStream.write("\t{\n")

        generateKeyPiar(options, keyPiarWriteStream);

        if (i === options.number - 1)
        {
          if (!keyPiarWriteStream.write("\t}\n"))
          {
            running = false;
          }
        }
        else
        {
          if(!keyPiarWriteStream.write("\t},\n"))
          {
            running = false;
          }
        }

        i++;
      }

      keyPiarWriteStream.write("}")
    })().catch(e => {
      console.fatal(e);
      process.exit(1);
    })
  });

program.parse(process.argv);