const fs = require('fs');
const path = require('path')
fs.readdir('./consensus_server/logs/consensus_log', (err, files) => {
	for(let file of files)
		console.log(path.join('./consensus_server/logs/consensus_log', file))
});