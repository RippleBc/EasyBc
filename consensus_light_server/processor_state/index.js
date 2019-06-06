const pm2 = require('pm2');
const { QUERY_MAX_LIMIT, SUCCESS, PARAM_ERR, OTH_ERR } = require("../../constant");

const app =  process[Symbol.for('app')];
const mysql = process[Symbol.for("mysql")];
const printErrorStack = process[Symbol.for("printErrorStack")]

app.post('/status', (req, res) => {
	pm2.list((err, processDescriptionList) => {
		if(!!err)
		{
			printErrorStack(err);

			return res.json({
				code: OTH_ERR,
				msg: `pm2.list throw error, ${err.toString()}`
			})
		}

		for(let processDescription of processDescriptionList)
		{
			if(processDescription.name === 'fullConsensus')
			{
				return res.json({
					code: SUCCESS,
					data: {
						"name": processDescription.name,
						"pid": processDescription.pid,
						"pm_id": processDescription.pm_id,
						"memory": processDescription.monit ? processDescription.monit.memory : undefined,
						"cpu": processDescription.monit ? processDescription.monit.cpu : undefined
					}
				})
			}
		}

		res.json({
			code: OTH_ERR,
			msg: 'cpu and memory info is can not get'
		})
	})
});

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

	mysql.getLogs({
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

	mysql.getTimeConsume({ 
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

	mysql.getAbnormalNodes({ 
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