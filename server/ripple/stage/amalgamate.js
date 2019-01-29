const Candidate = require("../data/candidate")
const nodes = require("../../nodes")
const util = require("../../../utils")
const {batchSendCandidate} = require("../chat")
const async = require("async")

const {RIPPLE_STATE_AMALGAMATE, RIPPLE_STATE_CANDIDATE_AGREEMENT, TRANSACTION_NUM_EACH_ROUND} = require("../../constant")

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
	}

	run()
	{
		const self = this;

		sendCandidate(this.ripple);

		this.ripple.initTimeout(() => {
			// check round stage
			if(self.ripple.state !== RIPPLE_STATE_AMALGAMATE)
			{
				return;
			}

			self.ripple.timeout = null;

			// check and transfer to next round
			if(nodes.checkIfAllNodeHasMet(self.ripple.activeNodes))
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
	// get cached transactions
	let transactions = ripple.processor.transactionsPool.splice(0, TRANSACTION_NUM_EACH_ROUND);
	//
	ripple.candidate.batchPush(transactions);
	ripple.candidate.poolDataToCandidateTransactions();
	//
	batchSendCandidate(ripple);
}

function amalgamateCandidate(ripple, candidate)
{
	// check state
	if(ripple.state !== RIPPLE_STATE_AMALGAMATE)
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

	// merge
	candidate.candidateTransactionsToPoolData();
	ripple.candidate.batchPush(candidate.data, true);

	// check if mandatory time window is end
	if(ripple.timeout)
	{
		return;
	}

	// check and transfer to next round
	if(nodes.checkIfAllNodeHasMet(self.ripple.activeNodes))
	{
		ripple.state = RIPPLE_STATE_CANDIDATE_AGREEMENT;
		ripple.emit("amalgamateOver");
	}
}