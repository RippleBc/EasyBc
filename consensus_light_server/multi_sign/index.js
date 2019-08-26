const { QUERY_MAX_LIMIT, SUCCESS, PARAM_ERR, OTH_ERR } = require("../../constant");

const app = process[Symbol.for('app')];
const mysql = process[Symbol.for("mysql")];
const printErrorStack = process[Symbol.for("printErrorStack")]

app.post("/getMultiSignPayRequest", (req, res) => {
  if (undefined === req.body.offset) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need offset"
    });
  }

  if (undefined === req.body.limit) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need limit"
    });
  }

  if (req.body.limit >= QUERY_MAX_LIMIT) {
    return res.json({
      code: PARAM_ERR,
      msg: `param error, limit must little than ${QUERY_MAX_LIMIT}`
    })
  }

  mysql.getMultiSignPayRequest(req.body).then(({ count, rows }) => {
    res.json({
      code: SUCCESS,
      data: {
        count: count,
        multiSignPayRequests: rows
      }
    })
  }).catch(e => {
    printErrorStack(e);

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    });
  });
});

app.post("/getMultiSignPay", (req, res) => {
  if (undefined === req.body.offset) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need offset"
    });
  }

  if (undefined === req.body.limit) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need limit"
    });
  }

  if (req.body.limit >= QUERY_MAX_LIMIT) {
    return res.json({
      code: PARAM_ERR,
      msg: `param error, limit must little than ${QUERY_MAX_LIMIT}`
    })
  }

  mysql.getMultiSignPay(req.body).then(({ count, rows }) => {
    res.json({
      code: SUCCESS,
      data: {
        count: count,
        multiSignPays: rows
      }
    })
  }).catch(e => {
    printErrorStack(e);
    
    res.json({
      code: OTH_ERR,
      msg: e.toString()
    });
  });
});