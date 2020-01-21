const log4js = require("./logConfig");
const logger = log4js.getLogger("proxy");
const mongoConfig = require("../consensus_full_server/config").mongo;

process[Symbol.for("loggerProxy")] = logger;
process[Symbol.for("loggerP2p")] = log4js.getLogger("p2p");
process[Symbol.for("loggerNet")] = log4js.getLogger("net");

const utils = require("../depends/utils");

process[Symbol.for("mongo")] = require("../depends/mongo_wrapper");
process[Symbol.for("getStackInfo")] = function (e) {

    let err;

    if (e) {
        err = e
    }
    else {
        try {
            throw new Error('call stack')
        }
        catch (e) {
            err = e;
        }
    }


    if (err.stack) {
        if (err.stack.split('\r\n').length > 1) {
            return err.stack.split('\r\n').join('');
        }
        else {
            return err.stack.split('\n').join('');
        }
    }
    else {
        return err
    }

}

//
process.on("uncaughtException", function (err) {
    logger.fatal(process[Symbol.for("getStackInfo")](err))

    process.exit(1);
});

(async function () {
    // init mongo
    await process[Symbol.for("mongo")].initBaseDb(mongoConfig.host, mongoConfig.port, mongoConfig.user, mongoConfig.password, mongoConfig.dbName);

    // init unl
    const UnlManager = require("../consensus_full_server/unlManager");
    const unlManager = new UnlManager();
    await unlManager.flushUnlToMemory();
    process[Symbol.for("unlManager")] = unlManager;

    // init private key
    const { privateKey } = require("../globalConfig.json").blockChain
    process[Symbol.for("privateKey")] = Buffer.from(privateKey, "hex");
    const publicKey = utils.privateToPublic(process[Symbol.for("privateKey")]);
    process[Symbol.for("address")] = utils.publicToAddress(publicKey).toString("hex");

    /************************************** p2p **************************************/
    const P2p = require("./p2p");
    const p2p = process[Symbol.for("p2p")] = new P2p(function (message) {
        processor.handleMessage(message);
    });

    /************************************** consensus **************************************/
    const Processor = require("./processor");
    const processor = process[Symbol.for('processor')] = new Processor();

    /************************************** init p2p and consensus **************************************/
    await p2p.init();

    //
    require("./command")
})();


console.log("process.pid: " + process.pid)