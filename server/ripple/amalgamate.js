const Candidate = require("./candidate")
const nodes = require("../nodes")
const util = require("../../utils")
const {sendCandidate} = require("./chat")

const {RIPPLE_STATE_AMALGAMATE, RIPPLE_STATE_CANDIDATE_AGREEMENT, RIPPLE_STATE_BLOCK_AGREEMENT, ROUND_DEFER} = require("../constant")

class Amalgamate
{
	constructor(ripple)
	{
		const self = this;

		this.ripple = ripple;
		this.ripple.expressApp.post("/sendCandidate", function(req, res) {
	    if(!req.body.candidate) {
	        res.send({
	            code: PARAM_ERR,
	            msg: "param error, need candidate"
	        });
	        return;
	    }

	    processCandidate(ripple, req.body.candidate);
	  });

		// amalgamate begin
	  this.ripple.on("blockAgreementOver", () => {
	  	self.ripple.state = RIPPLE_STATE_AMALGAMATE;
	  });
	}

	run()
	{
		sendCandidate()

		this.ripple.initTimeout(() => {
			// amalgamate end
			ripple.emit("amalgamateOver");
		});
	}
}


function processCandidate(ripple, candidate, cb)
{
	candidate = new Candidate(candidate);

	// check candidate
	if(!candidate.validate())
	{
		return false;
	}

	// merge
	candidate.candidateTransactionsToPoolData();
	//
	ripple.candidatesPoolSem.take(() => {

		if(ripple.state === RIPPLE_STATE_AMALGAMATE)
		{
			//
			ripple.candidatesPool.batchPush(candidate.data);

			//
			nodes.recordActiveNode(candidate.from);

			if(nodes.checkIfAllNodeHasMet())
			{
				// amalgamate end
				clearTimeout(ripple.timeout);
				ripple.emit("amalgamateOver");
			}
		}
		
		// 
		ripple.candidatesPoolSem.leave();
		cb();
	});
}