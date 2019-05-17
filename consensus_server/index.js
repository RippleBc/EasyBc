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
    const client_parser_process = fork(path.join(__dirname, './client_parser/index.js'));
    const log_parser_process = fork(path.join(__dirname, './log_parser/index.js'));

    process.on('exit', (code) => {
        client_parser_process.kill();
        log_parser_process.kill();
    });

    client_parser_process.on('message', ({cmd, data}) => {
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

    client_parser_process.on('error', err => {
        logger.fatal(`client_parser_process, throw exception, ${err}`);

        process.exit(1);
    });

    client_parser_process.on('exit', (code, signal) => {
        if(signal && signal === 'SIGTERM')
        {
            return logger.trace('client_parser_process, exited success');
        }
        if(code && code === 0)
        {
            return logger.trace('client_parser_process, exited success');
        }

        logger.fatal('client_parser_process, exited abnormal');
        process.exit(1);
    });

    //
    log_parser_process.send({
        cmd: 'run',
        data: {
            dir: path.join(__dirname, './logs'),
            logsBufferMaxSize: 10
        } 
    })

    log_parser_process.on('error', err => {
        logger.fatal(`log_parser_process, throw exception, ${err}`);

        process.exit(1);
    });

    log_parser_process.on('exit', (code, signal) => {
        if(signal && signal === 'SIGTERM')
        {
            return logger.trace('log_parser_process, exited success');
        }
        if(code && code === 0)
        {
            return logger.trace('log_parser_process, exited success');
        }

        logger.fatal('log_parser_process, exited abnormal');
        process.exit(1);
    });
})();