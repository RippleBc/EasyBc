const process = require("process");
const log4js= require("./logConfig");
const logger = log4js.getLogger();

process[Symbol.for("loggerP2p")] = log4js.getLogger("p2p");
process[Symbol.for("loggerNet")] = log4js.getLogger("net");
process[Symbol.for("loggerConsensus")] = log4js.getLogger("consensus");
process[Symbol.for("loggerMysql")] = log4js.getLogger("mysql");
process[Symbol.for("loggerUpdate")] = log4js.getLogger("update");
process[Symbol.for("loggerQuery")] = log4js.getLogger("query");

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

/************************************** p2p **************************************/
const p2p = process[Symbol.for("p2p")] = new P2p();

/************************************** consensus **************************************/
const Processor = require("./processor");
const processor = new Processor();

process[Symbol.for('processor')] = processor;

/************************************** init p2p and consensus **************************************/
p2p.init((address, message) => {
    processor.handleMessage(address, message);
});

processor.run();

/************************************** http **************************************/
require('./http')