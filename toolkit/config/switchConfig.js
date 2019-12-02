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
        ["blockChain", "privateKey"]
    ],
    "p2p_proxy_server/config.json": [
        ["http", "port"],
        ["p2pProxy", "open"],
        ["p2pProxy", "port"]
    ]
}


module.exports = options => {
    
    for (let filename in configs)
    {
        console.log(`change ${filename} begin`);
        changeConfig(filename, configs[filename], (fields, lastItem) => {
            const lastFieldIndex = fields.length - 1;
            const lastField = fields[lastFieldIndex];

            if (lastField === 'port' 
            && options.dbIndex)
            {
                console.log(`\tchange port => ${fields.map((field, index) => {
                    if (index === lastFieldIndex)
                    {
                        return field; 
                    }

                    return `${field} => `
                }).join('')}, ${options.dbIndex}`);
                lastItem[lastField] = lastItem[lastField] + 100 * options.dbIndex;
            }

            if (lastField === 'dbName' 
            && options.dbIndex)
            {
                console.log(`\tchange dbName => ${fields.map((field, index) => {
                    if (index === lastFieldIndex)
                    {
                        return field; 
                    }

                    return `${field} => `
                }).join('')}, ${options.dbIndex}`);
                lastItem[lastField] = `${lastItem[lastField]}${options.dbIndex}`
            }

            // switch process index
            if (filename === 'globalConfig.json' 
            && lastField === 'index' 
            && options.processIndex)
            {
                console.log(`\tchange processIndex => ${fields.map((field, index) => {
                    if (index === lastFieldIndex)
                    {
                        return field; 
                    }

                    return `${field} => `
                }).join('')}, ${options.processIndex}`);
                lastItem[lastField] = options.processIndex;
            }

            // switch privateKey
            if (filename === 'globalConfig.json' 
            && fields[0] === 'blockChain'
            && lastField === 'privateKey' 
            && options.privateKey) {
                console.log(`\tchange privateKey => ${fields.map((field, index) => {
                    if (index === lastFieldIndex)
                    {
                        return field; 
                    }

                    return `${field} => `
                }).join('')}, ${options.privateKey}`)

                lastItem[lastField] = options.privateKey
            }

            // switch p2p mode
            if (filename === 'p2p_proxy_server/config.json' 
            && fields[0] === 'p2pProxy' 
            && lastField === 'open')
            {
                if (options.p2pProxyOpen)
                {
                    console.log("\topen proxy p2p")
                    lastItem[lastField] = true
                }
                else
                {
                    console.log("\tclose proxy p2p")
                    lastItem[lastField] = false
                }
            }
        });

        console.log(`change ${filename} end\n`);
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
        
        handler(item, configItem);
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

