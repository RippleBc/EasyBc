const process = require('process');
const pm2 = require('pm2');
const { SUCCESS, PARAM_ERR, OTH_ERR } = require("../../../constant");

const app =  process[Symbol.for('app')];

let processDescription;

setInterval(() => {
	pm2.list((err, processDescriptionList) => {
		if(err)
		{
			throw new Error(`pm2.list throw error, ${err.toString()}`);
		}

		for(let val of processDescriptionList.values())
		{
			if(val.name === 'consensus')
			{
					processDescription = val
			}
		}
	});
}, 5000);

app.get('/status', (req, res) => {
	res.json({
		code: SUCCESS,
		data: {
			"name": processDescription.name,
			"pid": processDescription.pid,
			"pm_id": processDescription.pm_id,
			"memory": processDescription.monit.memory,
			"cpu": processDescription.monit.cpu
		}
	})
});