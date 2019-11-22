const path = require("path");
const fs = require("fs");

const READ_NUM_EACH = 100;

const configs = {
    "consensus_full_server/config.json": [
        ["tcp", "port"],
        ["http", "port"],
        ["mysql", "dbName"],
        ["mongo", "dbName"]
    ],
    "consensus_light_server/config.json": [
        ["mysql", "dbName"],
        ["mongo", "dbName"],
        ["fullConsensus", "port"],
        ["port"]
    ],
    "consensus_log_parser/config.json": [
        ["mysql", "dbName"]
    ],
    "consensus_transaction_parser/config.json": [
        ["mysql", "dbName"],
        ["mongo", "dbName"]
    ],
    "globalConfig.json": [
        ["index"],
        ["blockChain", "privateKey"],
        ["p2pProxy", "open"],
        ["p2pProxy", "port"]
    ],
    "p2p_proxy_server/config.json": [
        ["http", "port"]
    ]
}


module.exports = options => {
    
    for (let filename in configs)
    {
        changeConfig(filename, configs[filename], (field, item) => {
            if (field === 'port' && options.dbIndex)
            {
                console.log(`change port, ${filename} => ${configs[filename]}, ${options.dbIndex}`);
                item[field] = item[field] + 100 * options.dbIndex;
            }

            if (field === 'dbName' && options.dbIndex)
            {
                console.log(`change dbName, ${filename} => ${configs[filename]}, ${options.dbIndex}`);
                item[field] = `${item[field]}${options.dbIndex}`
            }

            if (field === 'index' && options.processIndex)
            {
                console.log(`change processIndex, ${filename} => ${configs[filename]}, ${options.processIndex}`);
                item[field] = options.processIndex;
            }

            if (field === 'open')
            {
                if (options.p2pProxyOpen)
                {
                    console.log("open proxy p2p")
                    item[field] = true
                }
                else
                {
                    console.log("close proxy p2p")
                    item[field] = false
                }
            }

            if (field === 'privateKey' && options.privateKey)
            {
                console.log(`change privateKey, ${filename} => ${configs[filename]}, ${options.privateKey}`)

                item[field] = options.privateKey
            }
        })
    }
}

const changeConfig = (filename, items, handler) => {
    let configFd = fs.openSync(path.join(__dirname, "../../", filename), "r");

    //read
    let realReadNum = 0;
    let readOffset = 0;
    let readBuffer = Buffer.alloc(19901112);
    do {
        realReadNum = fs.readSync(configFd, readBuffer, readOffset, READ_NUM_EACH);

        readOffset += realReadNum;
    } while (realReadNum >= READ_NUM_EACH);

    // modify
    let configJson = JSON.parse(readBuffer.slice(0, readOffset).toString().replace(/(\r\n)|\r|\n|\t|\s/g, ''));

    for (let item of items)
    {
        let configItem = configJson;
        let i = 0;
        for (; i < item.length - 1; i ++)
        {
            configItem = configItem[item[i]];
        }
        
        handler(item[i], configItem);
    }

    // write
    configFd = fs.openSync(path.join(__dirname, "../../", filename), "w");

    const newConfigBuffer = Buffer.from(JSON.stringify(configJson, null, '\t'));

    let writeNum = 0;
    let writeOffset = 0;
    do {
        writeNum = fs.writeSync(configFd, newConfigBuffer, writeOffset);

        writeOffset += writeNum;
    } while (writeOffset < newConfigBuffer.length);
}

