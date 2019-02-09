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
		module.exports.postAmalgamateCandidate(ripple, node, util.baToHexString(ripple.candidate.serialize()));
	});
}

/**
 * @param {Ripple} ripple
 */
module.exports.postBatchConsensusCandidate = function(ripple)
{
	ripple.candidate.sign(util.toBuffer(privateKey));

	nodeList.forEach(function(node) {
		module.exports.postConsensusCandidate(ripple, node, util.baToHexString(ripple.candidate.serialize()));
	});
}

/**
 * @param {Ripple} ripple
 */
module.exports.postBatchConsensusTime = function(ripple)
{
	ripple.time.sign(util.toBuffer(privateKey));

	nodeList.forEach(function(node) {
		module.exports.postConsensusTime(ripple, node, util.baToHexString(ripple.time.serialize()));
	});
}

/**
 * @param {Ripple} ripple
 */
module.exports.postBatchConsensusBlock = function(ripple)
{
	ripple.block.sign(util.toBuffer(privateKey));
	
	nodeList.forEach(function(node) {
		module.exports.postConsensusBlock(ripple, node, util.baToHexString(ripple.block.serialize()));
	});
}

/**
 * @param {String|Object} candidate
 */
module.exports.postAmalgamateCandidate = function(ripple, node, candidate)
{
	if(typeof candidate === "object")
	{
		candidate = util.baToHexString(candidate.serialize());
	}

	post(logger, node.url + "/amalgamateCandidate", {candidate: candidate}, function(err, response) {
		if(!!err)
		{
			ripple.emit("amalgamateCandidateInnerErr", {node: node});
			return;
		}

		if(response.code !== SUCCESS)
		{
			ripple.emit("amalgamateCandidateErr", {node: node});
			return;
		}

		ripple.emit("amalgamateCandidateSuccess", {node: node});
	});
}

/**
 * @param {String|Object} candidate
 */
module.exports.postConsensusCandidate = function(ripple, node, candidate)
{
	if(typeof candidate === "object")
	{
		candidate = util.baToHexString(candidate.serialize());
	}

	let state = ripple.state;

	post(logger, node.url + "/consensusCandidate", {candidate: candidate, state: state}, function(err, response) {
		if(!!err)
		{
			ripple.emit("consensusCandidateInnerErr", {node: node, state: state});
			return;
		}

		if(response.code !== SUCCESS)
		{
			ripple.emit("consensusCandidateErr", {node: node, state: state});
			return;
		}

		ripple.emit("consensusCandidateSuccess", {node: node, state: state});
	});
}

/**
 * @param {String|Object} time
 */
module.exports.postConsensusTime = function(ripple, node, time)
{
	if(typeof time === "object")
	{
		time = util.baToHexString(time.serialize());
	}
	logger.error("#########################")
	post(logger, node.url + "/consensusTime", {time: time}, function(err, response) {
		if(!!err)
		{
			ripple.emit("consensusTimeInnerErr", {node: node});
			return;
		}

		if(response.code !== SUCCESS)
		{
			ripple.emit("consensusTimeErr", {node: node});
			return;
		}

		ripple.emit("consensusTimeSuccess", {node: node});
	});
}

/**
 * @param {String|Object} rippleBlock
 */
module.exports.postConsensusBlock = function(ripple, node, rippleBlock)
{
	if(typeof rippleBlock === "object")
	{
		rippleBlock = util.baToHexString(rippleBlock.serialize());
	}

	post(logger, node.url + "/consensusBlock", {rippleBlock: rippleBlock}, function(err, response) {
		if(!!err)
		{
			ripple.emit("consensusBlockInnerErr", {node: node});
			return;
		}

		if(response.code !== SUCCESS)
		{
			ripple.emit("consensusBlockErr", {node: node});
			return;
		}

		ripple.emit("consensusBlockSuccess", {node: node});
	});
}