const levelup = require("levelup");
const leveldown = require("leveldown");
const path = require('path');

const db = levelup(leveldown(path.join(__dirname, '../data')));

const OFFSET_KEY = 'logFileStartOffset'
const LOG_FILE_KEY = 'currentLogFile'

module.exports.getLogFile = async function(dir)
{
	return new Promise((resolve, reject) => {
		db.get(`${LOG_FILE_KEY}_${dir}`, (err, value) => {
			if(!!err)
			{
				if(err.toString().includes('NotFoundError'))
				{
					resolve()
				}
				reject(err);
			}

			if(value)
			{
				resolve(value.toString());
			}
			resolve();
		});
	})
}

/**
 * @param
 */
module.exports.saveLogFile = async function(dir, logFile)
{
	return new Promise((resolve, reject) => {
		db.put(`${LOG_FILE_KEY}_${dir}`, logFile, err => {
			if(!!err)
			{
				reject(err);
			}

			resolve();
		});
	})
}

module.exports.getOffset = async function(dir)
{
	return new Promise((resolve, reject) => {
		db.get(`${OFFSET_KEY}_${dir}`, (err, value) => {
			if(!!err)
			{
				if(err.toString().includes('NotFoundError'))
				{
					resolve()
				}
				reject(err);
			}

			if(value)
			{
				resolve(parseInt(value));
			}
			resolve();
		});
	})
}

/**
 * @param
 */
module.exports.saveOffset = async function(dir, offset)
{
	return new Promise((resolve, reject) => {
		db.put(`${OFFSET_KEY}_${dir}`, offset, err => {
			if(!!err)
			{
				reject(err);
			}

			resolve();
		});
	})
}