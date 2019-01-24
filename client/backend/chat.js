const {post} = require("../../http/request")
const util = require("../../utils")
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../../const")
const Account = require("../../account");

const log4js= require("../logConfig")
const logger = log4js.getLogger()
const errlogger = log4js.getLogger("err")
const othlogger = log4js.getLogger("oth")

/**
 * @param {Transaction} tx
 */
module.exports.sendTransactionToWorkNodes = function(url, tx, cb)
{
	post(logger, url + "/sendTransaction", {tx: util.baToHexString(tx.serialize())}, function(err, response) {
		if(!!err)
		{
			return cb(err);
		}

		if(response.code !== SUCCESS)
		{
			return cb(response.msg);
		}
		
		cb(null);
	});
}

/**
 * @param {Buffer} transactionHash
 */
module.exports.getTransactionState = function(url, transactionHash,  cb)
{
	post(logger, url + "/getTransactionState", {hash: util.baToHexString(transactionHash)}, function(err, response) {
		if(!!err)
		{
			return cb(err);
		}

		if(response.code !== SUCCESS)
		{
			return cb(response.msg);
		}
		
		cb(null, response.data);
	});
}

/**
 * @param {Buffer} address
 */
module.exports.getAccountInfo = function(url, address, cb)
{
	post(logger, url + "/getAccountInfo", {address: util.baToHexString(address)}, function(err, response) {
		if(!!err)
		{
			return cb(err);
		}

		if(response.code !== SUCCESS)
		{
			return cb(response.msg);
		}
		
		cb(null, new Account(response.data).toJSON(true));
	});
}