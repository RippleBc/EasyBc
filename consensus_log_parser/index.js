const process = require('process');
const fs = require('fs');
const path = require('path');
const readLine = require('./readLine');
const Mysql = require("./mysql");
const log4js= require("./logConfig");
const { logDir, logsBufferMaxSize } = require("./config.json");
const assert = require("assert");

const logger = log4js.getLogger("logParse");

const mysql = new Mysql();

//
process.on("uncaughtException", function(err) {
    logger.fatal(`log parser, throw exception, ${err.stack}`);
    
    process.exit(1);
});

(async () => {
	await mysql.init();

	const logDirs = await readDir(logDir);

	for(let ld of logDirs)
	{
		run(path.join(logDir, ld), logsBufferMaxSize).catch(e => {
			logger.fatal(`run, throw exception, ${e.stack ? e.stack : e.toString("hex")}`);
			process.exit(1);
		})
	}
})().catch(e => {
	logger.fatal(`log parser throw exception, ${e.stack ? e.statck : e.toString("hex")}`);
	process.exit(1);
})

/**
 * @param {String} dir
 */
const readDir = async function(dir)
{
	assert(typeof dir === 'string', `logParser readDir, dir should be a String, now is ${typeof dir}`)

	const promise = new Promise((resolve, reject) => {
		fs.readdir(dir, (err, files) => {
			if(!!err)
			{
				reject(err);
			}

			files.sort();

			logger.trace(`readDir ${dir}, files: ${files}`)

			resolve(files)
		});
	})

	return promise;
}

const run = async function(dir, logsBufferMaxSize)
{
	assert(typeof dir === 'string', `logParser readDir, dir should be a String, now is ${typeof dir}`)
	assert(typeof logsBufferMaxSize === 'number', `logParser readDir, logsBufferMaxSize should be a Number, now is ${typeof logsBufferMaxSize}`)

	// fetch current log file and offset
	let { logFile, offset } = await mysql.getLogParserState(dir);

	// 
	let files = [];
	let index = 0;

	logger.trace(`logParser run, init logFile: ${logFile}, offset: ${offset}`);

	const readLogs = async function(index)
	{
		if(logFile !== files[index])
		{
			logFile = files[index];
			offset = 0;

			await mysql.saveLogFile(dir, logFile);
			await mysql.saveOffset(dir, offset);
		}

		let logs = [];

		logger.trace(`logParser run, start to readLogs, logFile: ${logFile}, offset: ${offset}`);

		const rl = readLine.createInterface({
			input: fs.createReadStream(path.join(dir, files[index]), {
				start: offset
			})
		});

		while(true)
		{
			let line = await rl.readLine();

			logger.trace(`fileName: ${files[index]}, line: ${line}`)

			if(line === null)
			{
				await mysql.saveLogs(logs);
				await mysql.saveOffset(dir, offset);

				if(index === (files.length - 1) && Date.now() - new Date(files[index].match(/(?<=-)[\d- ]+/g)).valueOf() < (65 * 1000))
				{
					// read log file has finished and may be there will have new logs to write in, wait a moment and try to read this log file again
					return new Promise((resolve, reject) => {
						setTimeout(() => {
							resolve('repeat');
						}, 2000); 
					});
				}
				else
				{
					// read log file has finished and there will not have new logs to write in, then del log file and read next log file
					fs.unlinkSync(path.join(dir, files[index]))
					logger.trace(`logParser run, delete log file ${path.join(dir, files[index])} success`)

					return 'next';
				}
			}

			//
			offset += line.length;

	  	const [timeStr] = line.match(/(?<=\[)[\d-:\.T]+(?=\])/g) || []
	  	const time = new Date(timeStr).valueOf();
	  	const [type] = line.match(/(?<=\[)[A-Z]+(?=\])/g) || [];
	  	const [title] = line.match(/[a-zA-Z\d]+(?=\s)/) || [];
	  	const data = line.substring(line.search(/\s-\s/) + 3);

	  	if(!isNaN(time) && typeof time === 'number' && typeof type === 'string' && typeof title === 'string' && typeof data === 'string')
	  	{
	  		logs.push({time, type, title, data});
	  	}

	  	if(logs.length >= logsBufferMaxSize)
	  	{
	  		await mysql.saveLogs(logs);
				await mysql.saveOffset(dir, offset);
	  		
	  		logs = [];
	  	}
		}
	}

	while(true)
	{
		// check if all log files is finished
		if(index >= files.length)
		{
			// try to fetch new log files
			while(true)
			{
				files = await readDir(dir);
				if(files.length <= 0)
				{
					await new Promise((resolve, reject) => {
						setTimeout(() => {
							resolve()
						}, 2000)
					})
				}
				else
				{
					index = 0;

					break;
				}
			}
		}

		// read log file
		const result = await readLogs(index);

		// read log file finish, turn to next log file
		if(result === 'next')
		{
			index ++;

			logger.trace(`logParser run, try to read next file, ${index >= files.length ? 'wait to be refresh' : files[index]}`);

			continue;
		}

		// read log file finish, repeat to read
		if(result === 'repeat')
		{
			logger.trace(`logParser run, try to read the same log file, ${files[index]}`);

			continue;
		}
	}
}