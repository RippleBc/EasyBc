const nodes = require("../../nodes")
const Time = require("../data/time")
const util = require("../../../utils")
const {postConsensusTime, postBatchConsensusTime} = require("../chat")
const {RIPPLE_STATE_TIME_AGREEMENT, RIPPLE_STATE_BLOCK_AGREEMENT, SEND_DATA_DEFER} = require("../../constant")
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../../../const")

const log4js= require("../../logConfig");
const logger = log4js.getLogger();
const errLogger = log4js.getLogger("err");
const othLogger = log4js.getLogger("oth");

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

	    // check stage
			if(self.ripple.state !== RIPPLE_STATE_TIME_AGREEMENT)
			{
				res.send({
            code: STAGE_INVALID,
            msg: `param error, current stage is ${self.ripple.state}`
        });
				return;
			}

			res.send({
          code: SUCCESS,
          msg: ""
      });

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

			setTimeout(() => {
				postConsensusTime(self.ripple, data.url, self.ripple.time);
			}, SEND_DATA_DEFER);
			
		});

	  this.ripple.on("consensusTimeErr", data => {
	  	// check stage
			if(self.ripple.state !== RIPPLE_STATE_TIME_AGREEMENT)
			{
				return;
			}

			setTimeout(() => {
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
	time = new Time(time);

	// check time
	let errors = time.validateSignatrue(true);
	if(!!errors === true)
	{
		logger.info(`class TimeAgreement, time ripple.recordActiveNode(time.from); is failed, ${errors}`);
	}
	else
	{
		ripple.recordActiveNode(time.from);

		// record
		ripple.time.push(util.bufferToInt(time.time));
	}
	

	// check if mandatory time window is end
	if(ripple.timeout)
	{
		return;
	}
	
	// check and transfer to next stage
	if(nodes.checkIfAllNodeHasMet(ripple.activeNodes))
	{
		ripple.state = RIPPLE_STATE_BLOCK_AGREEMENT;
		ripple.emit("timeAgreementOver");
	}
}

module.exports = TimeAgreement;