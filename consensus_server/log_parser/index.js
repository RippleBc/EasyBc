const process = require('process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Mysql = require("../mysql");
const { getLogFile, saveLogFile, getOffset, saveOffset } = require('./db');
const log4js= require("../logConfig");

const logger = log4js.getLogger();

process[Symbol.for("loggerMysql")] = log4js.getLogger("mysql");
process[Symbol.for("loggerClientParse")] = logger;

const mysql = new Mysql();

process.on('message', ({cmd, data}) => {
	switch(cmd)
	{
		case 'run':
		{
			const dir = data.dir;
			const logsBufferMaxSize = data.logsBufferMaxSize;

			(async () => {
				await mysql.init();

				const logDirs = await readDir(dir);

				for(let logdir of logDirs)
				{
					run(path.join(dir, logdir), logsBufferMaxSize).catch(e => {

						process.exit(1);
					});;
				}
			})()
		}
		break;
	}
	
})

const readDir = async function(dir)
{
	const promise = new Promise((resolve, reject) => {
		fs.readdir(dir, (err, files) => {
			if(!!err)
			{
				reject(err);
			}

			files = files.sort((a, b) => {
				return a > b
			});

			resolve(files)
		});
	})

	return promise;
}

const run = async function(dir, logsBufferMaxSize)
{
	var logFile = await getLogFile(dir)
	var offset = await getOffset(dir)

	logger.trace(`logParser run, init logFile:${logFile}, offset: ${offset}`);

	let files = await readDir(dir);

	const readLogs = async function(index)
	{
		if(logFile !== files[index])
		{
			logFile = files[index];
			offset = 0;

			await saveLogFile(dir, logFile);
			await saveOffset(dir, offset);
		}

		const promise = new Promise((resolve, reject) => {
			let logs = [];
			let counter = 0;

			logger.trace(`logParser run, start to readLogs, logFile:${logFile}, offset: ${offset}`);

			const rl = readline.createInterface({
				input: fs.createReadStream(path.join(dir, files[index]), {
					start: offset
				}),
				crlfDelay: Infinity
			});

			rl.on('line', line => {
				if(line.length <= 0)
				{
					logger.trace('logParser run, there is no new logs');
					return;
				}

				offset += line.length;
				counter += 1;

		  	const [timeStr] = line.match(/(?<=\[)[\d-:\.T]+(?=\])/g) || []
		  	const time = new Date(timeStr).valueOf();
		  	const [type] = line.match(/(?<=\[)[A-Z]+(?=\])/g) || [];
		  	const [title] = line.match(/[a-zA-Z\d]+(?=\s)/) || [];
		  	const data = line.substring(line.search(/\s-\s/) + 3);

		  	if(time !== NaN && typeof time === 'number' && typeof type === 'string' && typeof title === 'string' && typeof data === 'string')
		  	{
		  		logs.push({time, type, title, data});
		  	}

		  	if(counter >= logsBufferMaxSize)
		  	{
		  		mysql.saveLogs(logs).then(() => {
		  			return saveOffset(dir, offset);
		  		}).catch(e => {
		  			logger.fatal(`logParser run, throw exception, ${e}`)
		  			process.exit(1)
		  		})

		  		counter = 0;
		  		logs = [];
		  	}
			});

			rl.on('close', () => {
				mysql.saveLogs(logs).then(() => {
					return saveOffset(dir, offset);
				}).catch(e => {
					logger.fatal(`logParser run, throw exception, ${e}`)
					process.exit(1)
				})

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