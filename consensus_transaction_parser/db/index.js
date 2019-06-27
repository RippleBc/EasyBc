const levelup = require("levelup");
const leveldown = require("leveldown");
const path = require('path');
const assert = require('assert');

const db = levelup(leveldown(path.join(__dirname, '../data')));

const BLOCK_NUMBER_KEY = 'blockNumber'

/**
 * @return {Buffer}
 */
module.exports.getBlockNumber = async function()
{
	return new Promise((resolve, reject) => {
		db.get(BLOCK_NUMBER_KEY, (err, value) => {
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
				resolve(value);
			}
			resolve();
		});
	})
}

/**
 * @param {Buffer} number
 */
module.exports.saveBlockNumber = async function(number)
{
	assert(Buffer.isBuffer(number), `saveBlockNumber, number should be an Buffer, now is ${typeof number}`)

	return new Promise((resolve, reject) => {
		db.put(BLOCK_NUMBER_KEY, number, err => {
			if(!!err)
			{
				reject(err);
			}

			resolve();
		});
	})
}