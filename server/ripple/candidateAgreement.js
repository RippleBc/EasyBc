const Candidate = require("./candidate")
const nodes = require("../nodes")
const util = require("../../utils")
const {batchConsensusCandidate} = require("./chat")
const async = require("async")

const {RIPPLE_STATE_CANDIDATE_AGREEMENT, RIPPLE_STATE_BLOCK_AGREEMENT, ROUND_DEFER, ROUND_NUM} = require("../constant")

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
	  		ripple.clearInvalidTransaction(self.threshhold);
	  	}

	  	// check if ite round is over
	  	if(self.index > ROUND_NUM)
	  	{
	  		self.index = 1;
	  		// transfer to block agreement stage
				self.ripple.state = RIPPLE_STATE_BLOCK_AGREEMENT;
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
			self.candidatesPoolSem.take(() => {
				// check round stage
				if(self.ripple.state !== RIPPLE_STATE_CANDIDATE_AGREEMENT)
				{
					self.candidatesPoolSem.leave();
					return;
				}

				self.ripple.emit("amalgamateOver");

				self.candidatesPoolSem.leave();
			});
		});
	}
}

function sendCandidate(ripple)
{
	let candidateTransactions;

	async.waterfall([
		function(cb) {
			ripple.candidatesPoolSem.take((() => {
				cb();
			});
		},
		function(cb){
			// 
			ripple.candidatesPool.poolDataToCandidateTransactions();
			//
			batchConsensusCandidate(ripple, ripple.candidatesPool);
		}], function() {
			ripple.candidatesPoolSem.leave();
		});
}

function processCandidate(ripple, candidate)
{
	const EXIT_CODE = 1;

	async.waterfall([
		function(cb)
		{
			ripple.candidatesPoolSem.take(() => {
				cb()
			});
		},
		function(cb)
		{
			// check round stage
			if(ripple.state !== RIPPLE_STATE_CANDIDATE_AGREEMENT)
			{
				return cb(EXIT_CODE);
			}

			// check candidate
			candidate = new Candidate(candidate);
			if(!candidate.validate())
			{
				return cb(EXIT_CODE);
			}

			// merge
			candidate.candidateTransactionsToPoolData();

			//
			ripple.candidatesPool.batchPush(candidate.data, cb);
		}], function() {
			let activeNodes = ripple.recordActiveNode(candidate.from);

			if(nodes.checkIfAllNodeHasMet(activeNodes))
			{
				clearTimeout(ripple.timeout);

				ripple.emit("amalgamateOver");
			}
			ripple.candidatesPoolSem.leave();
		});
}