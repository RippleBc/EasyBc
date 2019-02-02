const nodes = require("../../nodes")
const Time = require("../data/time")
const util = require("../../../utils")
const {postConsensusTime, postBatchConsensusTime} = require("../chat")
const {RIPPLE_STATE_TIME_AGREEMENT, RIPPLE_STATE_BLOCK_AGREEMENT, SEND_DATA_DEFER} = require("../../constant")
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../../../const")

class TimeAgreement
{
	constructor(ripple)
	{
		const self = this;

		this.ripple = ripple;

		this.ripple.express.post("/consensusTime", function(req, res) {
			if(!req.body.time) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need time"
        });
        return;
	    }

	    consensusTime(self.ripple, req.body.time);
		});

		this.ripple.on("candidateAgreementOver", () => {
			self.run();
		});

		this.ripple.on("consensusTimeInnerErr", data => {
			// check stage
			if(self.ripple.state !== RIPPLE_STATE_TIME_AGREEMENT)
			{
				return;
			}

			setTimout(() => {
				postConsensusTime(self.ripple, data.url, self.ripple.time);
			}, SEND_DATA_DEFER);
			
		});

	  this.ripple.on("consensusTimeErr", data => {
	  	// check stage
			if(self.ripple.state !== RIPPLE_STATE_TIME_AGREEMENT)
			{
				return;
			}

			setTimout(() => {
				postConsensusTime(self.ripple, data.url, self.ripple.time);
			}, SEND_DATA_DEFER);
	  	
	  });
	}

 	run()
 	{
 		const self = this;

 		// reset active nodes
 		self.ripple.activeNodes = [];

		sendTime(this.ripple);

		this.ripple.initTimeout(() => {
			// check round stage
			if(self.ripple.state !== RIPPLE_STATE_TIME_AGREEMENT)
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
	postBatchConsensusTime(ripple);
}

function consensusTime(ripple, time)
{
	// check round stage
	if(ripple.state !== RIPPLE_STATE_TIME_AGREEMENT)
	{
		return;
	}

	// check if mandatory time window is end
	if(ripple.timeout)
	{
		return;
	}

	ripple.recordActiveNode(time.from);

	// check time
	time = new Time(time);
	if(!time.validate())
	{
		return;
	}

	// record
	ripple.time.push(util.bufferToInt(time.time));

	// check and transfer to next stage
	if(nodes.checkIfAllNodeHasMet(self.ripple.activeNodes))
	{
		ripple.state = RIPPLE_STATE_BLOCK_AGREEMENT;
		ripple.emit("timeAgreementOver");
	}
}

module.exports = TimeAgreement;