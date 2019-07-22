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

  if(processor.consensus.perishNode(Buffer.from(req.body.address, 'hex')))
  {
    res.json({
      code: SUCCESS
    })
  }
  else
  {
    res.json({
      code: PARAM_ERR,
      msg: "perish is processing"
    })
  }
});

app.post("/pardonNodes", (req, res) => {
  if (!req.body.addresses) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need address"
    });
  }

  processor.consensus.pardonNodes(req.body.addresses).then(() => {
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
})