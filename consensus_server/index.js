const process = require("process");
const log4js= require("./logConfig");
const logger = log4js.getLogger("loggerConsensus");
const { fork } = require("child_process");
const path = require('path');

process[Symbol.for("loggerConsensus")] = logger;
process[Symbol.for("loggerP2p")] = log4js.getLogger("p2p");
process[Symbol.for("loggerNet")] = log4js.getLogger("net");
process[Symbol.for("loggerMysql")] = log4js.getLogger("mysql");
process[Symbol.for("loggerUpdate")] = log4js.getLogger("update");

const express = require("express");
const bodyParser = require("body-parser");
const assert = require("assert");
const utils = require("../depends/utils");
const P2p = require("./p2p");
const { http } = require("./config");
const { SUCCESS, PARAM_ERR, OTH_ERR, BLOCK_CHAIN_DATA_DIR } = require("../constant");
const levelup = require("levelup");
const leveldown = require("leveldown");
const Mysql = require("./mysql");

process[Symbol.for("db")] = levelup(leveldown(BLOCK_CHAIN_DATA_DIR));
process[Symbol.for("mysql")] = new Mysql();

const Buffer = utils.Buffer;
const toBuffer = utils.toBuffer;
const bufferToInt = utils.bufferToInt;

//
process.on("uncaughtException", function(err) {
    logger.fatal(err.stack);
    process.exit(1);
});

(async function() {
    await process[Symbol.for("mysql")].init();

    /************************************** p2p **************************************/
    const p2p = process[Symbol.for("p2p")] = new P2p(function(message) {
        processor.handleMessage(this.address, message);
    });

    /************************************** consensus **************************************/
    const Processor = require("./processor");
    const processor = process[Symbol.for('processor')] = new Processor();

    /************************************** init p2p and consensus **************************************/
    await p2p.init();

    processor.run();

    /************************************** query **************************************/
    const query_process = fork(path.join(__dirname, './query/index.js'));

    process.on('exit', (code) => {
        query_process.kill('endSuccess');
    });

    query_process.on('message', ({cmd, data}) => {
        switch(cmd)
        {
            case 'processTransaction':
            {
                processor.processTransaction(data).then(() => {
                    logger.trace(`transaction: ${data}, is processing`);
                }).catch(e => {
                    logger.warn(`transaction: ${data}, is invalid`);
                })
            }
            break;
        }
    });

    query_process.on('error', err => {
        logger.fatal(`query_process, throw exception, ${err}`);

        process.exit(1);
    });

    query_process.on('exit', (code, signal) => {
        if(signal && signal === 'endSuccess')
        {
            logger.trace('query_process, exited success');
        }
        if(code && code === 0)
        {
            logger.trace('query_process, exited success');
        }

        logger.fatal('query_process, exited abnormal');
    });

})();