const express = require("express");
const { SUCCESS, PARAM_ERR, OTH_ERR } = require("../../constant");
const { port, host } = require("../config.json").http;
const bodyParser = require("body-parser");

const log4js = require("../logConfig");
const logger = log4js.getLogger("command");

const processor = process[Symbol.for("processor")]

const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json({limit: "1mb"}));

const server = app.listen(port, host, function () {
  logger.info(`server listening at http://${host}:${port}`);
});

log4js.useLogger(app, logger);

app.post("/perishNode", (req, res) => {
  if (!req.body.address) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need address"
    });
  }

  processor.consensus.perishNode(Buffer.from(req.body.address, 'hex'))

  res.json({
    code: SUCCESS
  })
});