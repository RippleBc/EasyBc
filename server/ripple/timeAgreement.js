const {RIPPLE_STATE_CANDIDATE_AGREEMENT, RIPPLE_STATE_BLOCK_AGREEMENT, ROUND_DEFER, ROUND_NUM} = require("../constant")

class TimeAgreement
{
	constructor(ripple)
	{
		this.ripple = ripple;

		this.ripple.express.post("/consensusTime", function(req, res) {
			if(!req.body.time) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need time"
        });
        return;
	    }

	    // vote
	    processTime(self.ripple, req.body.time);
		});

		this.ripple.on("candidateAgreementOver", () => {
			run();
		});
	}

 	run()
 	{
 		const self = this;

 		this.ripple.time.reset();

		// vote
		sendTime(this.ripple);

		this.ripple.initTimeout(() => {
			// check round stage
			if(self.ripple.state !== RIPPLE_STATE_CANDIDATE_AGREEMENT)
			{
				return;
			}

			self.ripple.emit("timeAgreementOver");
		});
 	}
}

function sendTime(ripple)
{
	let now = Date.time();
	ripple.time.push(now);
	//
	batchConsensusTime(ripple, ripple.time);
}

function processTime(ripple, time)
{
	// check round stage
	if(ripple.state !== RIPPLE_STATE_TIME_AGREEMENT)
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

		ripple.emit("timeAgreementOver");
	}
}