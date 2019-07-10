const log4js= require("./logConfig");
const logger = log4js.getLogger("consensus");
const mongoConfig = require("./config").mongo;

process[Symbol.for("loggerConsensus")] = logger;
process[Symbol.for("loggerP2p")] = log4js.getLogger("p2p");
process[Symbol.for("loggerNet")] = log4js.getLogger("net");
process[Symbol.for("loggerMysql")] = log4js.getLogger("mysql");
process[Symbol.for("loggerUpdate")] = log4js.getLogger("update");
process[Symbol.for("loggerStageConsensus")] = log4js.getLogger("stageConsensus");
process[Symbol.for("loggerPerishNode")] = log4js.getLogger("perishNode");

const utils = require("../depends/utils");
const Mysql = require("./mysql");

process[Symbol.for("mysql")] = new Mysql();
process[Symbol.for("mongo")] = require("../depends/mpt_db_wrapper");
process[Symbol.for("getStackInfo")] = function(e) {

    let err;

    if(e)
    {
        err = e
    } 
    else
    {
        try
        {
            throw new Error('call stack')
        }
        catch(e)
        {
            err = e;
        }
    }
    

    if(err.stack)
    {
        if(err.stack.split('\r\n').length > 1)
        {
            return err.stack.split('\r\n').join('');
        }
        else
        {
            return err.stack.split('\n').join('');
        }
    }
    else
    {
        return err
    }
    
}

//
process.on("uncaughtException", function(err) {
    logger.fatal(process[Symbol.for("getStackInfo")](err))
    
    process.exit(1);
});

(async function() {
    // init mysql
    await process[Symbol.for("mysql")].init();

    // init mongo
    await process[Symbol.for("mongo")].initBaseDb(mongoConfig.host, mongoConfig.port, mongoConfig.user, mongoConfig.password);

    // init unl
    const UnlManager = require("./unlManager");
    const unlManager = new UnlManager();
    await unlManager.init();
    process[Symbol.for("unlManager")] = unlManager;
    process[Symbol.for("unl")] = unlManager.unl

    // init private key
    const { privateKey } = require("./config.json")
    process[Symbol.for("privateKey")] = Buffer.from(privateKey, "hex");
    const publicKey = utils.privateToPublic(process[Symbol.for("privateKey")]);
    process[Symbol.for("address")] = utils.publicToAddress(publicKey).toString("hex");

    /************************************** p2p **************************************/
    const P2p = require("./p2p");
    const p2p = process[Symbol.for("p2p")] = new P2p(function(message) {
        processor.handleMessage(this.address, message);
    });

    /************************************** consensus **************************************/
    const Processor = require("./processor");
    const processor = process[Symbol.for('processor')] = new Processor();

    /************************************** init p2p and consensus **************************************/
    await p2p.init();

    processor.run();
})();


console.log("process.pid: " + process.pid)