const path = require("path");
const fs = require("fs");

const READ_NUM_EACH = 100;

module.exports = (mode) => {
    let globalConfigFd = fs.openSync(path.join(__dirname, "../../globalConfig.json"), "r");

    //read
    let realReadNum = 0;
    let readOffset = 0;
    let readBuffer = Buffer.alloc(19901112);
    do {
        realReadNum = fs.readSync(globalConfigFd, readBuffer, readOffset, READ_NUM_EACH);

        readOffset += realReadNum;
    } while (realReadNum >= READ_NUM_EACH);

    // modify
    let globalConfigJson = JSON.parse(readBuffer.slice(0, readOffset).toString().replace(/(\r\n)|\r|\n|\t|\s/g, ''));

    if(mode === 'proxy')
    {
        globalConfigJson.p2pProxy.open = true;
    }
    else
    {
        globalConfigJson.p2pProxy.open = false;
    }

    // write
    globalConfigFd = fs.openSync(path.join(__dirname, "../../globalConfig.json"), "w");

    const newGlobalConfigBuffer = Buffer.from(JSON.stringify(globalConfigJson, null, '\t'));

    let writeNum = 0;
    let writeOffset = 0;
    do {
        writeNum = fs.writeSync(globalConfigFd, newGlobalConfigBuffer, writeOffset);

        writeOffset += writeNum;
    } while (writeOffset < newGlobalConfigBuffer.length);
}

