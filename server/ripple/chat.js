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

	nodeList.foreach(function(node) {
		module.exports.postConsensusCandidate(ripple, node.url, util.baToHexString(ripple.candidate.serialize()));
	});
}

/**
 * @param {Ripple} ripple
 */
module.exports.postBatchConsensusTime = function(ripple)
{
	ripple.time.sign(util.toBuffer(privateKey));

	nodeList.foreach(function(node) {
		module.exports.postConsensusTime(ripple, node.url, util.baToHexString(ripple.time.serialize()));
	});
}

/**
 * @param {Ripple} ripple
 */
module.exports.postBatchConsensusBlock = function(ripple)
{
	ripple.block.sign(util.toBuffer(privateKey));
	
	nodeList.foreach(function(node) {
		module.exports.postConsensusBlock(ripple, node.url, util.baToHexString(ripple.block.serialize()));
	});
}

/**
 * @param {String} candidate
 */
module.exports.postAmalgamateCandidate = function(ripple, url, candidate)
{
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
 * @param {String} candidate
 */
module.exports.postConsensusCandidate = function(ripple, url, candidate)
{
	post(logger, url + "/consensusCandidate", {candidate: candidate}, function(err, response) {
		if(!!err)
		{
			ripple.emit("consensusCandidateInnerErr", {url: url});
			return;
		}

		if(response.code !== SUCCESS)
		{
			ripple.emit("consensusCandidateErr", {url: url, code: response.code});
			return;
		}

		ripple.emit("consensusCandidateSuccess");
	});
}

/**
 * @param {String} time
 */
module.exports.postConsensusTime = function(ripple, url, time)
{
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
 * @param {String} rippleBlock
 */
module.exports.postConsensusBlock = function(ripple, url, rippleBlock)
{
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