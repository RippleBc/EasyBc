const {post} = require("../../http/request")
const util = require("../../utils")
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../../const")
const {nodeList} = require("../nodes")

const log4js= require("../logConfig")
const logger = log4js.getLogger()
const errlogger = log4js.getLogger("err")
const othlogger = log4js.getLogger("oth")


module.exports.batchSendCandidate = function(ripple, url, candidate)
{
	let funcs = [];
	nodeList.foreach(function(node) {
		module.exports.sendCandidate(node.url, candidate, function(err, response) {
			if(!!err)
			{

			}

			if(response.code === SUCCESS)
			{

			}
		});
	});
}

module.exports.batchSendTransaction = function(ripple, url, transaction)
{
	let funcs = [];
	nodeList.foreach(function(node) {
		module.exports.sendTransaction(node.url, transaction, function(err, response) {
			if(!!err)
			{

			}
			if( response.code === SUCCESS)
			{
				ripple.emit("tranasctionConsensus", response.data);
			}
		});
	});
}

module.exports.batchSendBlock = function(ripple, url, block, cb)
{
	let funcs = [];
	nodeList.foreach(function(node) {
		module.exports.sendBlock(node.url, block, function(err, response) {
			if(!!err)
			{

			}
			if( response.code === SUCCESS)
			{
				ripple.emit("blockConsensus", response.data);
			}
		});
	});
}


/**
 * @param {Candidate} tx
 */
module.exports.sendCandidate = function(url, candidate, cb)
{
	post(logger, url + "/sendRippleCandidate", {candidate: util.baToHexString(candidate.serialize())}, function(err, response) {
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
 * @param {RippleTransaction} transactionHash
 */
module.exports.sendTransaction = function(url, transaction,  cb)
{
	post(logger, url + "/sendRippleTransaction", {transaction: util.baToHexString(transaction.serialize())}, function(err, response) {
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
 * @param {RippleBlock} block
 */
module.exports.sendBlock = function(url, block, cb)
{
	post(logger, url + "/sendRippleBlock", {block: util.baToHexString(block..serialize())}, function(err, response) {
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