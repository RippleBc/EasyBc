const process = require('process');
const pm2 = require('pm2');
const { SUCCESS, PARAM_ERR, OTH_ERR } = require("../../constant");

const app =  process[Symbol.for('app')]

let processDescriptionList;

setInterval(() => {
	pm2.list((err, val) => {
		if(err)
		{
			throw new Error(`pm2.list throw error, ${err.toString()}`);
		}

		processDescriptionList = val
	});
}, 5000);

app.get('/status', (req, res) => {
	const nodeInfos = [];	
	for(let value of processDescriptionList.values())
	{
		nodeInfos.push({
			"name": value.name,
			"pid": pid.pid,
			"pm_id": pm_id.pm_id,
			"memory": memory.memory,
			"cpu": cpu.cpu
		})
	}
});