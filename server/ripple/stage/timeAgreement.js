const nodes = require("../../nodes")
const Time = require("../data/time")
const util = require("../../../utils")
const {batchConsensusTime} = require("../chat")
const {RIPPLE_STATE_CANDIDATE_AGREEMENT, RIPPLE_STATE_BLOCK_AGREEMENT} = require("../../constant")

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

	    processTime(self.ripple, req.body.time);
		});

		this.ripple.on("candidateAgreementOver", () => {
			run();
		});
	}

 	run()
 	{
 		const self = this;

		// vote
		sendTime(this.ripple);

		this.ripple.initTimeout(() => {
			// check round stage
			if(self.ripple.state !== RIPPLE_STATE_CANDIDATE_AGREEMENT)
			{
				return;
			}

			self.ripple.timeout = null;

			// check and transfer to next stage
			if(nodes.checkIfAllNodeHasMet(self.ripple.activeNodes))
			{
				ripple.state = RIPPLE_STATE_BLOCK_AGREEMENT;
				ripple.emit("timeAgreementOver");
			}
		});
 	}
}

function sendTime(ripple)
{
	ripple.time.time = Date.time();
	//
	batchConsensusTime(ripple);
}

function processTime(ripple, time)
{
	// check round stage
	if(ripple.state !== RIPPLE_STATE_TIME_AGREEMENT)
	{
		return;
	}

	// check time
	time = new Time(time);
	if(!time.validate())
	{
		return;
	}
	
	//
	ripple.recordActiveNode(time.from);

	// record
	ripple.time.push(util.bufferToInt(time.time));

	// check if mandatory time window is end
	if(ripple.timeout)
	{
		return;
	}

	// check and transfer to next stage
	if(nodes.checkIfAllNodeHasMet(self.ripple.activeNodes))
	{
		ripple.state = RIPPLE_STATE_BLOCK_AGREEMENT;
		ripple.emit("timeAgreementOver");
	}
}

module.exports = TimeAgreement;