const Candidate = require("./candidate")
const nodes = require("../nodes")
const util = require("../../utils")
const {batchConsensusCandidate} = require("./chat")
const async = require("async")
const {privateKey} = require("../nodes")
const {RIPPLE_STATE_CANDIDATE_AGREEMENT, RIPPLE_STATE_TIME_AGREEMENT, ROUND_DEFER, ROUND_NUM} = require("../constant")

const ROUND1_THRESHHOLD = 0.5
const ROUND2_THRESHHOLD = 0.6
const ROUND3_THRESHHOLD = 0.8

class CandidateAgreement
{
	constructor(ripple)
	{
		const self = this;

		this.ripple = ripple;
		this.index = 1;
		this.ripple.express.post("/consensusCandidate", function(req, res) {
			if(!req.body.candidate) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need candidate"
        });
        return;
	    }

	    // vote
	    processCandidate(self.ripple, req.body.candidate);
		});

		// entrance one
	  this.ripple.on("amalgamateOver", () => {
	  	// clear invalid transactions
	  	if(self.index === 2 || self.index === 3 || self.index === 4)
	  	{
	  		self.ripple.candidate.clearInvalidTransaction(self.threshhold);
	  		return;
	  	}

	
			// check if ite round is over
	  	if(self.index > ROUND_NUM)
	  	{
	  		self.index = 1;
	  		// transfer to block agreement stage
				self.ripple.state = RIPPLE_STATE_TIME_AGREEMENT;
	  		self.ripple.emit("candidateAgreementOver");
	  		return;
	  	}

	  	// compute
	  	if(self.index === 1)
	  	{
	  		self.threshhold = ROUND1_THRESHHOLD;
	  	}

	  	if(self.index === 2)
	  	{
	  		self.threshhold = ROUND2_THRESHHOLD;
	  	}

	  	if(self.index === 3)
	  	{
	  		self.threshhold = ROUND3_THRESHHOLD;
	  	}
	  	self.index += 1;

	  	//
	  	self.run();
	  });
	}

	// entrance two
	run()
	{
		const self = this;

		// vote
		sendCandidate(this.ripple);

		this.ripple.initTimeout(() => {
			// check round stage
			if(self.ripple.state !== RIPPLE_STATE_CANDIDATE_AGREEMENT)
			{
				self.candidateSem.leave();
				return;
			}

			self.ripple.emit("amalgamateOver");

			self.candidateSem.leave();
		});
	}
}

function sendCandidate(ripple)
{
	ripple.candidate.poolDataToCandidateTransactions();
	//
	ripple.candidate.sign(util.toBuffer(privateKey));
	//
	batchConsensusCandidate(ripple, ripple.candidate);
}

function processCandidate(ripple, candidate)
{
	// check round stage
	if(ripple.state !== RIPPLE_STATE_CANDIDATE_AGREEMENT)
	{
		return;
	}

	// check candidate
	candidate = new Candidate(candidate);
	if(!candidate.validate())
	{
		return;
	}

	// merge
	candidate.candidateTransactionsToPoolData();

	//
	ripple.candidate.batchPush(candidate.data);

	let activeNodes = ripple.recordActiveNode(candidate.from);

	if(nodes.checkIfAllNodeHasMet(activeNodes))
	{
		clearTimeout(ripple.timeout);

		ripple.emit("amalgamateOver");
	}
}