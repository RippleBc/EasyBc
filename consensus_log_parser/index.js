const process = require('process');
const fs = require('fs');
const path = require('path');
const readLine = require('./readLine');
const Mysql = require("./mysql");
const { getLogFile, saveLogFile, getOffset, saveOffset } = require('./db');
const log4js= require("./logConfig");
const { logDir, logsBufferMaxSize } = require("./config.json");
const assert = require("assert");

const logger = log4js.getLogger("logParse");

const mysql = new Mysql();

(async () => {
	await mysql.init();

	const logDirs = await readDir(logDir);

	for(let ld of logDirs)
	{
		run(path.join(logDir, ld), logsBufferMaxSize).catch(e => {
			logger.fatal(`run, throw exception, ${e}`);
			process.exit(1);
		})
	}
})()

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

	var logFile = await getLogFile(dir)
	var offset = await getOffset(dir)

	logger.trace(`logParser run, init logFile: ${logFile}, offset: ${offset}`);

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

		let logs = [];
		let counter = 0;

		logger.trace(`logParser run, start to readLogs, logFile: ${logFile}, offset: ${offset}`);

		const rl = readLine.createInterface({
			input: fs.createReadStream(path.join(dir, files[index]), {
				start: offset
			})
		});

		while(true)
		{
			let line = await rl.readLine();

			if(line === null)
			{
				await mysql.saveLogs(logs);
				await saveOffset(dir, offset);

				if(index < files.length - 1)
				{
					// del log file
					fs.unlinkSync(path.join(dir, files[index]))
					logger.trace(`logParser run, delete log file ${path.join(dir, files[index])} success`)

					return 'next';
				}
				else if(Date.now() - new Date(files[index].match(/(?<=\-)[\d-]+/g)).valueOf() < 24 * 60 * 60 * 1000)
				{
					return new Promise((resolve, reject) => {
						setTimeout(() => {
							resolve('repeat');
						}, 2000); 
					});;
				}
				else
				{
					// del log file
					fs.unlinkSync(path.join(dir, files[index]))
					logger.trace(`logParser run, delete log file ${path.join(dir, files[index])} success`)

					return 'refresh';
				}
			}

			//
			offset += line.length;
			counter += 1;

	  	const [timeStr] = line.match(/(?<=\[)[\d-:\.T]+(?=\])/g) || []
	  	const time = new Date(timeStr).valueOf();
	  	const [type] = line.match(/(?<=\[)[A-Z]+(?=\])/g) || [];
	  	const [title] = line.match(/[a-zA-Z\d]+(?=\s)/) || [];
	  	const data = line.substring(line.search(/\s-\s/) + 3);

	  	if(!isNaN(time) && typeof time === 'number' && typeof type === 'string' && typeof title === 'string' && typeof data === 'string')
	  	{
	  		logs.push({time, type, title, data});
	  	}

	  	if(counter >= logsBufferMaxSize)
	  	{
	  		await mysql.saveLogs(logs);
				await saveOffset(dir, offset);
	  		
	  		counter = 0;
	  		logs = [];
	  	}
		}
	}

	while(true)
	{
		if(files.length <= 0)
		{
			await new Promise((resolve, reject) => {
				setTimeout(() => {
					resolve()
				}, 2000)
			})

			files = await readDir(dir);
		}
		else
		{
			break;
		}
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
			index = 0;
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
					break;
				}
			}

			continue;
		}
	}
}