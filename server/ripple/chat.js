const {post} = require("../../http/request")
const util = require("../../utils")
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../../const")
const {nodeList} = require("../nodes")

const log4js= require("../logConfig")
const logger = log4js.getLogger()
const errlogger = log4js.getLogger("err")
const othlogger = log4js.getLogger("oth")


/**
 * @param {Processor} processor
 * @param {Candidate} block
 */
module.exports.batchAmalgamateCandidate = function(processor, candidate)
{
	let funcs = [];
	nodeList.foreach(function(node) {
		module.exports.amalgamateCandidate(node.url, util.baToHexString(candidate.serialize()), function(err, response) {
			if(!!err)
			{
				processor.emit("amalgamateCandidateErr");
				return;
			}

			if(response.code !== SUCCESS)
			{
				processor.emit("amalgamateCandidateErr");
				return;
			}

			processor.emit("amalgamateCandidateSuccess");
		});
	});
}

/**
 * @param {Processor} processor
 * @param {Candidate} candidate
 */
module.exports.batchConsensusCandidate = function(processor, candidate)
{
	let funcs = [];
	nodeList.foreach(function(node) {
		module.exports.consensusCandidate(node.url, candidate, function(err, response) {
			if(!!err)
			{
				processor.emit("consensusCandidateErr");
				return;
			}

			if(response.code !== SUCCESS)
			{
				processor.emit("consensusCandidateErr");
				return;
			}

			processor.emit("consensusCandidateSuccess");
		});
	});
}

/**
 * @param {Processor} processor
 * @param {Number} time
 */
module.exports.batchConsensusTime = function(processor, time)
{
	let funcs = [];
	nodeList.foreach(function(node) {
		module.exports.consensusTime(node.url, time, function(err, response) {
			if(!!err)
			{
				processor.emit("consensusTimeErr");
				return;
			}

			if(response.code !== SUCCESS)
			{
				processor.emit("consensusTimeErr");
				return;
			}

			processor.emit("consensusTimeSuccess");
		});
	});
}

/**
 * @param {Processor} processor
 * @param {RippleBlock} block
 */
module.exports.batchConsensusBlock = function(processor, block)
{
	let funcs = [];
	nodeList.foreach(function(node) {
		module.exports.consensusBlock(node.url, block, function(err, response) {
			if(!!err)
			{
				processor.emit("consensusBlockErr");
				return;
			}

			if(response.code !== SUCCESS)
			{
				processor.emit("consensusBlockErr");
				return;
			}

			processor.emit("consensusBlockSuccess");
		});
	});
}


/**
 * @param {Candidate} candidate
 */
module.exports.amalgamateCandidate = function(url, candidate, cb)
{
	post(logger, url + "/amalgamateCandidate", {candidate: util.baToHexString(candidate.serialize())}, cb);
}

/**
 * @param {Candidate} candidate
 */
module.exports.consensusCandidate = function(url, candidate,  cb)
{
	post(logger, url + "/consensusCandidate", {candidate: util.baToHexString(candidate.serialize())}, cb);
}

/**
 * @param {Number} time
 */
module.exports.consensusTime = function(url, time, cb)
{
	post(logger, url + "/consensusTime", {time: time}, cb);
}

/**
 * @param {RippleBlock} block
 */
module.exports.consensusBlock = function(url, block, cb)
{
	post(logger, url + "/consensusBlock", {block: util.baToHexString(block.serialize())}, cb);
}