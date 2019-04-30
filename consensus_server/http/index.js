const process = require("process");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors')
const { host, port } = require("../config.json").http;

const logger = process[Symbol.for("loggerQuery")];

// express
const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json({limit: "1mb"}));
app.use(cors({
  credentials: true, 
  origin: 'http://localhost:8080', // web前端服务器地址
}));

process[Symbol.for('app')] = app;

require('./block_chain');
require('./resource');

//
const server = app.listen(port, host, function() {
    logger.info(`server listening at http://${host}:${port}`);
});

