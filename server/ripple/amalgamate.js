const Candidate = require("./candidate")
const nodes = require("../nodes")
const util = require("../../utils")
const {batchSendCandidate} = require("./chat")
const async = require("async")

const {RIPPLE_STATE_AMALGAMATE, RIPPLE_STATE_CANDIDATE_AGREEMENT, ROUND_DEFER, TRANSACTION_NUM_EACH_ROUND} = require("../constant")

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

		// entrance one
	  this.ripple.on("blockAgreementOver", () => {
	  	self.run();
	  });
	}

	// entrance two
	run()
	{
		const self = this;

		sendCandidate(this.ripple);

		this.ripple.initTimeout(() => {
			self.candidatesPoolSem.take(() => {
				// check round stage
				if(self.ripple.state !== RIPPLE_STATE_AMALGAMATE)
				{
					self.candidatesPoolSem.leave();
					return;
				}

				// transfer to transaction agreement stage
				self.ripple.state = RIPPLE_STATE_CANDIDATE_AGREEMENT;
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
		function(cb) {
			ripple.processor.transactionsPoolSem.take(() => {
				cb();
			});
		},
		function(cb) {
			ripple.processor.transactionsPool.splice(0, TRANSACTION_NUM_EACH_ROUND, cb);
		},
		function(transactions, cb) {
			ripple.candidatesPool.batchPush(transactions, cb);
		},
		function(cb){
			// 
			ripple.candidatesPool.poolDataToCandidateTransactions();
			//
			batchSendCandidate(ripple, ripple.candidatesPool);
		}], function() {
			ripple.processor.transactionsPoolSem.leave();
			ripple.candidatesPoolSem.leave();
		});
}

function amalgamateCandidate(ripple, candidate)
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
			if(ripple.state !== RIPPLE_STATE_AMALGAMATE)
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

				// transfer to transaction agreement stage
				ripple.state = RIPPLE_STATE_CANDIDATE_AGREEMENT;
				ripple.emit("amalgamateOver");
			}
			ripple.candidatesPoolSem.leave();
		});
}