const process = require('process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Mysql = require("../mysql");
const { getLogFile, saveLogFile, getOffset, saveOffset } = require('./db');

// mysql.init().then(() => {
// 	process.on('run', ({dir, logsBufferMaxSize}) => {
// 		run(dir, logsBufferMaxSize);
// 	})
// })

const run = async function(dir, logsBufferMaxSize)
{
	var logFile = await getLogFile()
	var offset = await getOffset()

	const readDir = async function()
	{
		const promise = new Promise((resolve, reject) => {
			fs.readdir(dir, (err, files) => {
				if(!!err)
				{
					reject(err);
				}

				files = files.sort((a, b) => {
					return a < b
				});

				resolve(files)
			});
		})

		return promise;
	}
	
	let files = await readDir();

	const readLogs = async function(index)
	{
		if(logFile !== files[index])
		{
			logFile = files[index];
			offset = 0;

			await saveLogFile(logFile);
			await saveOffset(offset);
		}

		const promise = new Promise((resolve, reject) => {
			let logs = [];
			let counter = 0;

			const rl = readline.createInterface({
				input: fs.createReadStream(path.join(dir, files[index]), {
					encoding: 'utf8',
					start: offset
				}),
				crlfDelay: Infinity
			});

			rl.on('line', line => {
				if(line.length <= 0)
				{
					console.log('there is no new log');
					return;
				}

		  	offset += line.length;
		  	counter += 1;

		  	const time = new Date(line.match(/(?<=\[)[\d-:\.T]+(?=\])/g)).valueOf();
		  	const type = line.match(/(?<=\[)[A-Z]+(?=\])/g);
		  	const title = line.match(/[a-zA-Z]+(?=\s)/);
		  	const data = line.substring(line.search(/\s-\s/) + 3);

		  	console.log('line: ' + line)

		  	logs.push({time, type, title, data});

		  	if(counter >= logsBufferMaxSize)
		  	{

		  		saveOffset(offset);

		  		// mysql.saveLogs(logs);
		  		for(let log of logs)
		  		{
						console.log('time:' + time + ', type:' + type + ', title:' + title + ', data:' + data);
		  		}

		  		counter = 0;
		  		logs = [];
		  	}
			});

			rl.on('close', () => {
				saveOffset(offset);
				
				// mysql.saveLogs(logs);
	  		for(let log of logs)
	  		{
					console.log('time:' + log.time + ', type:' + log.type + ', title:' + log.title + ', data:' + log.data);
	  		}

				if(index < files.length - 1)
				{
					// del log file
					fs.unlinkSync(path.join(dir, files[index]))

					resolve('next');
				}
				else if(Date.now() - new Date(files[index].match(/(?<=\-)[\d-]+/g)).valueOf() < 24 * 60 * 60 * 1000)
				{
					setTimeout(() => {
						resolve('repeat');
					}, 2000);
				}
				else
				{
					// del log file
					fs.unlinkSync(path.join(dir, files[index]))

					resolve('refresh');
				}
			})
		});

		return promise;
	}

	let index = 0;
	while(index < files.length)
	{
		const result = await readLogs(index);
		if(result === 'next')
		{
			index ++;

			continue;
		}

		if(result === 'repeat')
		{
			continue;
		}
		else
		{
			files = await readDir();

			continue;
		}
	}
}


run('../logs/consensus_log', 2).then(() => {

}).catch(e => {
	console.error(e);

	process.exit(1);
});