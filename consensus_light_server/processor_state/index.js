const process = require('process');
const pm2 = require('pm2');
const { SUCCESS, PARAM_ERR, OTH_ERR } = require("../../constant");

const app =  process[Symbol.for('app')];
const mysql = process[Symbol.for("mysql")];

let processDescription = undefined;

setInterval(() => {
	pm2.list((err, processDescriptionList) => {
		if(err)
		{
			throw new Error(`pm2.list throw error, ${err.toString()}`);
		}

		for(let val of processDescriptionList.values())
		{
			if(val.name === 'fullConsensus')
			{
					return processDescription = val
			}
		}

		processDescription = undefined;
	});
}, 5000);

app.post('/status', (req, res) => {
	if(processDescription)
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
	
	res.json({
		code: OTH_ERR,
		msg: 'cpu and memory info is can not get'
	})
});

app.post('/logs', (req, res) => {
	const type = req.body.type;
	const title = req.body.title;
	const beginTime = req.body.beginTime;
	const endTime = req.body.endTime;

	mysql.getLogs({ type, title, beginTime, endTime }).then(result => {
		res.json({
			code: SUCCESS,
			data: {
				count: result.count,
				logs: result.rows.map(log => {
					return {
						id: log.id,
						time: log.time,
						type: log.type,
						title: log.title,
						data: log.data
					}
				})
			}
		})
	});
})

app.post("/timeConsume", (req, res) => {
	const type = req.body.type;
	const stage = req.body.stage;
	const beginTime = req.body.beginTime;
	const endTime = req.body.endTime;

	mysql.getLogs({ type, stage, beginTime, endTime }).then(result => {
		res.json({
			code: SUCCESS,
			data: {
				count: result.count,
				logs: result.rows.map(log => {
					return {
						id: log.id,
						time: log.time,
						type: log.type,
						stage: log.stage,
						data: log.data
					}
				})
			}
		})
	});
})

app.post("/abnormalNodes", (req, res) => {
	const type = req.body.type;
	const beginTime = req.body.beginTime;
	const endTime = req.body.endTime;

	mysql.getLogs({ type, beginTime, endTime }).then(result => {
		res.json({
			code: SUCCESS,
			data: {
				count: result.count,
				logs: result.rows.map(log => {
					return {
						id: log.id,
						time: log.time,
						type: log.type,
						data: log.data
					}
				})
			}
		})
	});
})