const {post} = require("../../http/request")
const util = require("../../utils")
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../../const")
const {nodeList, privateKey} = require("../nodes")

const log4js= require("../logConfig")
const logger = log4js.getLogger()
const errlogger = log4js.getLogger("err")
const othlogger = log4js.getLogger("oth")


/**
 * @param {Ripple} ripple
 */
module.exports.postBatchAmalgamateCandidate = function(ripple)
{
	ripple.candidate.sign(util.toBuffer(privateKey));

	nodeList.forEach(function(node) {
		module.exports.postAmalgamateCandidate(ripple, node.url, util.baToHexString(ripple.candidate.serialize()));
	});
}

/**
 * @param {Ripple} ripple
 */
module.exports.postBatchConsensusCandidate = function(ripple)
{
	ripple.candidate.sign(util.toBuffer(privateKey));

	nodeList.forEach(function(node) {
		module.exports.postConsensusCandidate(ripple, node.url, util.baToHexString(ripple.candidate.serialize()));
	});
}

/**
 * @param {Ripple} ripple
 */
module.exports.postBatchConsensusTime = function(ripple)
{
	ripple.time.sign(util.toBuffer(privateKey));

	nodeList.forEach(function(node) {
		module.exports.postConsensusTime(ripple, node.url, util.baToHexString(ripple.time.serialize()));
	});
}

/**
 * @param {Ripple} ripple
 */
module.exports.postBatchConsensusBlock = function(ripple)
{
	ripple.block.sign(util.toBuffer(privateKey));
	
	nodeList.forEach(function(node) {
		module.exports.postConsensusBlock(ripple, node.url, util.baToHexString(ripple.block.serialize()));
	});
}

/**
 * @param {String|Object} candidate
 */
module.exports.postAmalgamateCandidate = function(ripple, url, candidate)
{
	if(typeof candidate === "object")
	{
		candidate = util.baToHexString(candidate.serialize());
	}

	post(logger, url + "/amalgamateCandidate", {candidate: candidate}, function(err, response) {
		if(!!err)
		{
			ripple.emit("amalgamateCandidateInnerErr", {url: url});
			return;
		}

		if(response.code !== SUCCESS)
		{
			ripple.emit("amalgamateCandidateErr", {url: url, code: response.code});
			return;
		}

		ripple.emit("amalgamateCandidateSuccess");
	});
}

/**
 * @param {String|Object} candidate
 */
module.exports.postConsensusCandidate = function(ripple, url, candidate)
{
	if(typeof candidate === "object")
	{
		candidate = util.baToHexString(candidate.serialize());
	}

	post(logger, url + "/consensusCandidate", {candidate: candidate, state: ripple.state}, function(err, response) {
		if(!!err)
		{
			ripple.emit("consensusCandidateInnerErr", {url: url, state: ripple.state});
			return;
		}

		if(response.code !== SUCCESS)
		{
			ripple.emit("consensusCandidateErr", {url: url, code: response.code, state: ripple.state});
			return;
		}

		ripple.emit("consensusCandidateSuccess");
	});
}

/**
 * @param {String|Object} time
 */
module.exports.postConsensusTime = function(ripple, url, time)
{
	if(typeof time === "object")
	{
		time = util.baToHexString(time.serialize());
	}

	post(logger, url + "/consensusTime", {time: time}, function(err, response) {
		if(!!err)
		{
			ripple.emit("consensusTimeInnerErr", {url: url});
			return;
		}

		if(response.code !== SUCCESS)
		{
			ripple.emit("consensusTimeErr", {url: url, code: response.code});
			return;
		}

		ripple.emit("consensusTimeSuccess");
	});
}

/**
 * @param {String|Object} rippleBlock
 */
module.exports.postConsensusBlock = function(ripple, url, rippleBlock)
{
	if(typeof rippleBlock === "object")
	{
		rippleBlock = util.baToHexString(rippleBlock.serialize());
	}

	post(logger, url + "/consensusBlock", {rippleBlock: rippleBlock}, function(err, response) {
		if(!!err)
		{
			ripple.emit("consensusBlockInnerErr", {url: url});
			return;
		}

		if(response.code !== SUCCESS)
		{
			ripple.emit("consensusBlockErr", {url: url, code: response.code});
			return;
		}

		ripple.emit("consensusBlockSuccess");
	});
}