const { QUERY_MAX_LIMIT, SUCCESS, PARAM_ERR, OTH_ERR } = require("../../constant");
const { getMultiSignPayRequest, getMultiSignPay } = require("./db");

const app = process[Symbol.for('app')];
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

  getMultiSignPayRequest({
    offset: req.body.offset,
    limit: req.body.limit,
    address: req.body.address,
    txHash: req.body.txHash,
    action: req.body.action,
    timestamp: req.body.timestamp,
    to: req.body.to,
    value: req.body.value,
    sponsor: req.body.sponsor,
    beginTime: req.body.beginTime,
    endTime: req.body.endTime
  }).then(({ count, rows }) => {
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

  getMultiSignPay({
    offset: req.body.offset,
    limit: req.body.limit,
    address: req.body.address,
    txHash: req.body.txHash,
    timestamp: req.body.timestamp,
    to: req.body.to,
    value: req.body.value,
    beginTime: req.body.beginTime,
    endTime: req.body.endTime
  }).then(({ count, rows }) => {
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