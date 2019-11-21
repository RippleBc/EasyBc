const express = require("express");
const { SUCCESS, PARAM_ERR, OTH_ERR } = require("../../constant");
const { port, host } = require("../config.json").http;
const bodyParser = require("body-parser");

const log4js = require("../logConfig");
const logger = log4js.getLogger("command");

const processor = process[Symbol.for("processor")]
const p2p = process[Symbol.for("p2p")];

const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json({limit: "1mb"}));

const server = app.listen(port, host, function () {
  logger.info(`server listening at http://${host}:${port}`);
});

log4js.useLogger(app, logger);

app.post("/addNodes", (req, res) => {
  if(!req.body.nodes)
  {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need nodes"
    });
  }

  processor.consensus.addNodes(req.body.nodes).then(() => {
    res.json({
      code: SUCCESS
    })
  }).catch(e => {
    res.json({
      code: OTH_ERR,
      msg: e.toString()
    })
  })
})

app.post("/updateNodes", (req, res) => {
  if(!req.body.nodes)
  {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need nodes"
    });
  }

  processor.consensus.updateNodes(req.body.nodes).then(() => {
    res.json({
      code: SUCCESS
    })
  }).catch(e => {
    res.json({
      code: OTH_ERR,
      msg: e.toString()
    })
  })
})

app.post("/deleteNodes", (req, res) => {
  if (!req.body.nodes) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need nodes"
    });
  }

  processor.consensus.deleteNodes(req.body.nodes).then(() => {
    res.json({
      code: SUCCESS
    })
  }).catch(e => {
    res.json({
      code: OTH_ERR,
      msg: e.toString()
    })
  })
});

app.post("/processState", (req, res) => {
  res.json({
    code: SUCCESS,
    data: {
      sequence: processor.consensus.sequence.toString('hex'),
      view: processor.consensus.view.toString('hex'),
      hash: processor.consensus.hash.toString('hex'),
      number: processor.consensus.number.toString('hex'),
    }
  });
})