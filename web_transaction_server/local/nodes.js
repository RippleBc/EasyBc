const { Node: NodeModel } = process[Symbol.for("models")];
const { SUCCESS, OTH_ERR } = require("../../constant");

const app = process[Symbol.for("app")];
const printErrorStack = process[Symbol.for("printErrorStack")];

app.get("/getNodesInfo", function (req, res) {
  NodeModel.findAll().then(nodes => {
    res.send({
      code: SUCCESS,
      data: nodes
    });
  }).catch(e => {
    printErrorStack(e);

    res.send({
      code: OTH_ERR,
      msg: e.toString()
    });
  });
});