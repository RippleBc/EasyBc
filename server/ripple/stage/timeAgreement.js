const Time = require("../data/time")
const util = require("../../../utils")
const {postConsensusTime, postBatchConsensusTime} = require("../chat")
const {RIPPLE_STATE_EMPTY, RIPPLE_STATE_TIME_AGREEMENT, SEND_DATA_DEFER} = require("../../constant")
const {SUCCESS, PARAM_ERR, OTH_ERR, STAGE_INVALID} = require("../../../const")
const Stage = require("./stage")

const log4js= require("../../logConfig");
const logger = log4js.getLogger();
const errLogger = log4js.getLogger("err");
const othLogger = log4js.getLogger("oth");

class TimeAgreement extends Stage
{
	constructor(ripple)
	{
		super(ripple);
		
		const self = this;

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

			self.receive(self.ripple, req.body.time);
		});

		this.ripple.on("candidateAgreementOver", () => {
			self.ripple.state = RIPPLE_STATE_TIME_AGREEMENT;
			self.run();
		});

		this.ripple.on("consensusTimeInnerErr", data => {
			setTimeout(() => {
				postConsensusTime(self.ripple, data.node, self.ripple.time);
			}, SEND_DATA_DEFER);
		});

		this.ripple.on("consensusTimeErr", data => {
			setTimeout(() => {
				postConsensusTime(self.ripple, data.node, self.ripple.time);
			}, SEND_DATA_DEFER);
		});

		this.ripple.on("consensusTimeSuccess", data => {
			self.recordAccessedNode(data.node.address);

			// check if mandatory time window is end
			if(!self.checkIfTimeoutEnd())
			{
				return;
			}

			self.tryToEnterNextStage();
		});
	}

 	run()
 	{

 		logger.error("aaaaaaaaaaaaaaa")
 		const self = this;

		this.send(this.ripple);

		this.initTimeout();
 	}

 	send()
	{
		this.ripple.time.time = Date.time();
		//
		postBatchConsensusTime(this.ripple);
	}

	receive(time)
	{
		time = new Time(time);

		// check time
		let errors = time.validateSignatrue(true);
		if(!!errors === true)
		{
			logger.error(`class TimeAgreement, receive is failed, ${errors}`);
		}
		else
		{
			this.recordActiveNode(util.baToHexString(time.from));

			// record
			this.ripple.time.push(util.bufferToInt(time.time));
		}
		

		// check if mandatory time window is end
		if(!this.checkIfTimeoutEnd())
		{
			return;
		}
		
		this.tryToEnterNextStage();
	}

	tryToEnterNextStage()
	{
		// check and transfer to next stage
		if(this.checkIfCanEnterNextStage())
		{
			logger.warn("Class TimeAgreement, time consensus is over, go to next stage");

			this.ripple.state = RIPPLE_STATE_EMPTY;
			
			this.ripple.emit("timeAgreementOver");
		}
	}
}

module.exports = TimeAgreement;