const levelup = require("levelup");
const leveldown = require("leveldown");

const db = levelup(leveldown('./data'));

const OFFSET_KEY = 'logFileStartOffset'
const LOG_FILE_KEY = 'currentLogFile'

module.exports.getLogFile = async function()
{
	return new Promise((resolve, reject) => {
		db.get(LOG_FILE_KEY, (err, value) => {
			if(!!err)
			{
				if(err.toString().includes('NotFoundError'))
				{
					resolve()
				}
				reject(err);
			}

			resolve(value);
		});
	})
}

/**
 * @param
 */
module.exports.saveLogFile = async function(logFile)
{
	return new Promise((resolve, reject) => {
		db.put(LOG_FILE_KEY, logFile, err => {
			if(!!err)
			{
				reject(err);
			}

			resolve();
		});
	})
}

module.exports.getOffset = async function()
{
	return new Promise((resolve, reject) => {
		db.get(OFFSET_KEY, (err, value) => {
			if(!!err)
			{
				if(err.toString().includes('NotFoundError'))
				{
					resolve()
				}
				reject(err);
			}

			resolve(parseInt(value));
		});
	})
}

/**
 * @param
 */
module.exports.saveOffset = async function(offset)
{
	return new Promise((resolve, reject) => {
		db.put(OFFSET_KEY, offset, err => {
			if(!!err)
			{
				reject(err);
			}

			resolve();
		});
	})
}