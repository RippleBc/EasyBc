const { QUERY_MAX_LIMIT, SUCCESS, PARAM_ERR, OTH_ERR } = require("../../constant");
const { getLogs, getTimeConsume, getAbnormalNodes } = require("./db");

const app =  process[Symbol.for('app')];
const printErrorStack = process[Symbol.for("printErrorStack")];

app.post('/logs', (req, res) => {
	if(undefined === req.body.offset)
  {
      return res.json({
          code: PARAM_ERR,
          msg: "param error, need offset"
      });
  }

  if(undefined === req.body.limit)
  {
      return res.json({
          code: PARAM_ERR,
          msg: "param error, need limit"
      });
  }

  if(req.body.limit >= QUERY_MAX_LIMIT)
  {
      return res.json({
          code: PARAM_ERR,
          msg: `param error, limit must little than ${QUERY_MAX_LIMIT}`
      })
  }

	getLogs({
		offset: req.body.offset,
		limit: req.body.limit,
		type: req.body.type, 
		title: req.body.title, 
		beginTime: req.body.beginTime, 
		endTime: req.body.endTime 
	}).then(logs => {
		res.json({
			code: SUCCESS,
			data: {
				count: logs.count,
				logs: logs.rows
			}
		})
	}).catch(e => {
		printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    });
  });
})

app.post("/timeConsume", (req, res) => {
	if(undefined === req.body.offset)
  {
      return res.json({
          code: PARAM_ERR,
          msg: "param error, need offset"
      });
  }

  if(undefined === req.body.limit)
  {
      return res.json({
          code: PARAM_ERR,
          msg: "param error, need limit"
      });
  }

  if(req.body.limit >= QUERY_MAX_LIMIT)
  {
      return res.json({
          code: PARAM_ERR,
          msg: `param error, limit must little than ${QUERY_MAX_LIMIT}`
      })
  }

	getTimeConsume({ 
		offset: req.body.offset,
		limit: req.body.limit,
		type: req.body.type,
		stage: req.body.stage,
		beginTime: req.body.beginTime,
		endTime: req.body.endTime
	}).then(timeConsume => {
		res.json({
			code: SUCCESS,
			data: timeConsume
		})
	}).catch(e => {
		printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    });
  });
})

app.post("/abnormalNodes", (req, res) => {
	if(undefined === req.body.offset)
  {
      return res.json({
          code: PARAM_ERR,
          msg: "param error, need offset"
      });
  }

  if(undefined === req.body.limit)
  {
      return res.json({
          code: PARAM_ERR,
          msg: "param error, need limit"
      });
  }

  if(req.body.limit >= QUERY_MAX_LIMIT)
  {
      return res.json({
          code: PARAM_ERR,
          msg: `param error, limit must little than ${QUERY_MAX_LIMIT}`
      })
  }

	getAbnormalNodes({ 
		offset: req.body.offset,
		limit: req.body.limit,
		type: req.body.type,
		beginTime: req.body.beginTime,
		endTime: req.body.endTime
	}).then(abnormalNodes => {
		res.json({
			code: SUCCESS,
			data: abnormalNodes
		});
	}).catch(e => {
		printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    });
  });
})