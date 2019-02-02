const Candidate = require("../data/candidate")
const {checkIfAllNodeHasMet} = require("../../nodes")
const util = require("../../../utils")
const {postAmalgamateCandidate, postBatchAmalgamateCandidate} = require("../chat")
const async = require("async")
const {SUCCESS, PARAM_ERR, OTH_ERR, STAGE_INVALID} = require("../../../const")

const {RIPPLE_STATE_AMALGAMATE, RIPPLE_STATE_CANDIDATE_AGREEMENT, TRANSACTION_NUM_EACH_ROUND, SEND_DATA_DEFER} = require("../../constant")

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
	// check stage
	if(ripple.state !== RIPPLE_STATE_AMALGAMATE)
	{
		return;
	}

	// check if mandatory time window is end
	if(ripple.timeout)
	{
		return;
	}

	//
	ripple.recordActiveNode(candidate.from);

	// check candidate
	candidate = new Candidate(candidate);
	if(!candidate.validate())
	{
		return;
	}

	// merge transactions, filter same transaction
	candidate.candidateTransactionsToPoolData();
	ripple.candidate.batchPush(candidate.data, true);

	// check and transfer to next round
	if(checkIfAllNodeHasMet(self.ripple.activeNodes))
	{
		ripple.state = RIPPLE_STATE_CANDIDATE_AGREEMENT;
		ripple.emit("amalgamateOver");
	}
}

module.exports = Amalgamate;