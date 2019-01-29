const Candidate = require("./candidate")
const nodes = require("../nodes")
const util = require("../../utils")
const {batchConsensusCandidate} = require("../chat")
const async = require("async")
const {RIPPLE_STATE_CANDIDATE_AGREEMENT, RIPPLE_STATE_TIME_AGREEMENT, ROUND_NUM} = require("../constant")

const privateKey = nodes.privateKey;

const ROUND1_THRESHHOLD = 0.5
const ROUND2_THRESHHOLD = 0.6
const ROUND3_THRESHHOLD = 0.8

class CandidateAgreement
{
	constructor(ripple)
	{
		const self = this;

		this.ripple = ripple;
		this.round = 1;
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
	  	if(self.round === 2 || self.round === 3 || self.round === 4)
	  	{
	  		self.ripple.candidate.clearInvalidTransaction(self.threshhold);
	  		return;
	  	}

			// check if stage is over
	  	if(self.round > ROUND_NUM)
	  	{
	  		self.round = 1;
	  		// transfer to block agreement stage
				self.ripple.state = RIPPLE_STATE_TIME_AGREEMENT;
	  		self.ripple.emit("candidateAgreementOver");
	  		return;
	  	}

	  	// compute
	  	if(self.round === 1)
	  	{
	  		self.threshhold = ROUND1_THRESHHOLD;
	  	}

	  	if(self.round === 2)
	  	{
	  		self.threshhold = ROUND2_THRESHHOLD;
	  	}

	  	if(self.round === 3)
	  	{
	  		self.threshhold = ROUND3_THRESHHOLD;
	  	}

	  	//
	  	self.round += 1;

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
				return;
			}

			self.ripple.timeout = null;

			// check and transfer to next round
			if(nodes.checkIfAllNodeHasMet(self.ripple.activeNodes))
			{
				self.ripple.emit("amalgamateOver");
			}
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

	ripple.recordActiveNode(candidate.from);

	// check candidate
	candidate = new Candidate(candidate);
	if(!candidate.validate())
	{
		return;
	}

	// record
	candidate.candidateTransactionsToPoolData();
	ripple.candidate.batchPush(candidate.data);

	// check if mandatory time window is end
	if(ripple.timeout)
	{
		return;
	}

	// check and transfer to next round
	if(nodes.checkIfAllNodeHasMet(self.ripple.activeNodes))
	{
		ripple.emit("amalgamateOver");
	}
}