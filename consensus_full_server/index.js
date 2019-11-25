const log4js= require("./logConfig");
const logger = log4js.getLogger("consensus");
const mongoConfig = require("./config").mongo;
const { p2pProxy } = require("../p2p_proxy_server/config.json");

process[Symbol.for("loggerConsensus")] = logger;
process[Symbol.for("loggerP2p")] = log4js.getLogger("p2p");
process[Symbol.for("loggerNet")] = log4js.getLogger("net");
process[Symbol.for("loggerMysql")] = log4js.getLogger("mysql");
process[Symbol.for("loggerUpdate")] = log4js.getLogger("update");
process[Symbol.for("loggerStageConsensus")] = log4js.getLogger("stageConsensus");

const utils = require("../depends/utils");
const Mysql = require("./mysql");

process[Symbol.for("mysql")] = new Mysql();
process[Symbol.for("mongo")] = require("../depends/mongo_wrapper");
process[Symbol.for("getStackInfo")] = utils.getStackInfo;

//
process.on("uncaughtException", function(err) {
    logger.fatal(process[Symbol.for("getStackInfo")](err))
    
    process.exit(1);
});

(async function() {
    // init mysql
    await process[Symbol.for("mysql")].init();

    // init mongo
    await process[Symbol.for("mongo")].initBaseDb(mongoConfig.host, mongoConfig.port, mongoConfig.user, mongoConfig.password, mongoConfig.dbName);

    // init unl
    const UnlManager = require("./unlManager");
    const unlManager = new UnlManager();
    await unlManager.init();
    process[Symbol.for("unlManager")] = unlManager;
    
    // init private key
    const { privateKey } = require("../globalConfig.json").blockChain
    process[Symbol.for("privateKey")] = Buffer.from(privateKey, "hex");
    const publicKey = utils.privateToPublic(process[Symbol.for("privateKey")]);
    process[Symbol.for("address")] = utils.publicToAddress(publicKey).toString("hex");

    /************************************** p2p **************************************/
    const P2p = require("./p2p");
    const p2p = process[Symbol.for("p2p")] = new P2p(function(message) {
        if (p2pProxy.open)
        {
            let address = Buffer.alloc(32);
            
            if (message.data && message.data.length > 0)
            {
                let data;
                ([address, data] = utils.rlp.decode(message.data));
                message.data = data;
            }

            processor.handleMessage(address, message);
        }
        else
        {
            processor.handleMessage(this.address, message);
        }
    });

    /************************************** consensus **************************************/
    const Processor = require("./processor");
    const processor = process[Symbol.for('processor')] = new Processor();

    /************************************** init p2p and consensus **************************************/
    await p2p.init();

    //
    require("./command")

    processor.run();
})();


console.log("process.pid: " + process.pid)