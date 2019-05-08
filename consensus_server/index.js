const process = require("process");
const log4js= require("./logConfig");
const logger = log4js.getLogger();
const { fork } = require("child_process");
const path = require('path');

process[Symbol.for("loggerP2p")] = log4js.getLogger("p2p");
process[Symbol.for("loggerNet")] = log4js.getLogger("net");
const loggerConsensus = process[Symbol.for("loggerConsensus")] = log4js.getLogger("consensus");
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
    logger.error(err.stack);
    process.exit(1);
});

process[Symbol.for("mysql")].init().then(() => {
    /************************************** p2p **************************************/
    const p2p = process[Symbol.for("p2p")] = new P2p(function(message) {
        processor.handleMessage(this.address, message);
    });

    /************************************** consensus **************************************/
    const Processor = require("./processor");
    const processor = new Processor();

    process[Symbol.for('processor')] = processor;

    /************************************** init p2p and consensus **************************************/
    p2p.init();

    processor.run();

    /************************************** query **************************************/
    const query_process = fork(path.join(__dirname, './query/index.js'));

    query_process.on('message', ({cmd, data}) => {
        switch(cmd)
        {
            case 'processTransaction':
            {
                processor.processTransaction(data).then(() => {
                    loggerConsensus.info(`transaction: ${data}, is processing`);
                }).catch(e => {
                    loggerConsensus.error(`transaction: ${data}, is invalid`);
                })
            }
            break;
        }
    });

    query_process.on('error', err => {
        throw new Error(err);
    });

    query_process.on('exit', (code, signal) => {
        throw new Error('query_process exit');
    });
});