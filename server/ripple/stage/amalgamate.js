const Candidate = require("../data/candidate")
const {checkIfAllNodeHasMet} = require("../../nodes")
const util = require("../../../utils")
const {postAmalgamateCandidate, postBatchAmalgamateCandidate} = require("../chat")
const async = require("async")
const {SUCCESS, PARAM_ERR, OTH_ERR, STAGE_INVALID} = require("../../../const")
const {RIPPLE_STATE_AMALGAMATE, RIPPLE_STATE_CANDIDATE_AGREEMENT, TRANSACTION_NUM_EACH_ROUND, SEND_DATA_DEFER} = require("../../constant")

const log4js= require("../../logConfig");
const logger = log4js.getLogger();
const errLogger = log4js.getLogger("err");
const othLogger = log4js.getLogger("oth");

class Amalgamate
{
	constructor(ripple)
	{
		const self = this;

		this.ripple = ripple;

		this.ripple.express.post("/amalgamateCandidate", function(req, res) {
	    if(!req.body.candidate) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need candidate"
        });
        return;
	    }

	    // check stage
			if(self.ripple.state !== RIPPLE_STATE_AMALGAMATE)
			{
				res.send({
            code: STAGE_INVALID,
            msg: `param error, current stage is ${self.ripple.state}`
        });
				return;
			}

			res.send({
          code: SUCCESS,
          msg: ""
      });
      
	    amalgamateCandidate(self.ripple, req.body.candidate);
	  });

		this.ripple.on("amalgamateCandidateInnerErr", data => {
			// check stage
			if(self.ripple.state !== RIPPLE_STATE_AMALGAMATE)
			{
				return;
			}
			setTimeout(() => {
				postAmalgamateCandidate(self.ripple, data.url, self.ripple.candidate);
			}, SEND_DATA_DEFER);
	  	
		});

	  this.ripple.on("amalgamateCandidateErr", data => {
	  	// check stage
			if(self.ripple.state !== RIPPLE_STATE_AMALGAMATE)
			{
				return;
			}
			setTimeout(() => {
				postAmalgamateCandidate(self.ripple, data.url, self.ripple.candidate);
			}, SEND_DATA_DEFER);
	  	
	  });
	}

	run()
	{
		const self = this;

		// reset active nodes
		this.ripple.activeNodes = [];

		sendCandidate(this.ripple);

		this.ripple.initTimeout(() => {
			// check round stage
			if(self.ripple.state !== RIPPLE_STATE_AMALGAMATE)
			{
				return;
			}

			self.ripple.timeout = null;

			// check and transfer to next round
			if(checkIfAllNodeHasMet(self.ripple.activeNodes))
			{
				// transfer to transaction agreement stage
				self.ripple.state = RIPPLE_STATE_CANDIDATE_AGREEMENT;
				self.ripple.emit("amalgamateOver");
			}
		});
	}
}

function sendCandidate(ripple)
{
	// check if begin a new candidate
	if(ripple.candidate.length === 0)
	{
		// get cached transactions
		let transactions = ripple.processor.transactionsPool.splice(0, TRANSACTION_NUM_EACH_ROUND);
		// encode tranasctions
		ripple.candidate.batchPush(transactions);
	}
	
	ripple.candidate.poolDataToCandidateTransactions();
	//
	postBatchAmalgamateCandidate(ripple);
}

function amalgamateCandidate(ripple, candidate)
{
	
	candidate = new Candidate(candidate);

	// check candidate
	let errors1 = candidate.validateSignatrue(true);
	if(!!errors1 === true)
	{
		logger.info(`class Amalgamate, candidate validateSignatrue is failed, ${errors1}`);
	}
	else
	{
		ripple.recordActiveNode(candidate.from);
	}
	
	let errors2 = candidate.validateTransactions(true)
	if(!!errors2 === true)
	{
		logger.info(`class Amalgamate, candidate transactions is failed, ${errors2}`);
	}
	
	if(!!errors1 === false && !!errors2 === false)
	{
		// merge transactions, filter same transaction
		candidate.candidateTransactionsToPoolData();
		ripple.candidate.batchPush(candidate.data, true);
	}

	// check if mandatory time window is end
	if(ripple.timeout)
	{
		return;
	}

	// check and transfer to next round
	if(checkIfAllNodeHasMet(ripple.activeNodes))
	{
		ripple.state = RIPPLE_STATE_CANDIDATE_AGREEMENT;
		ripple.emit("amalgamateOver");
	}
}

module.exports = Amalgamate;