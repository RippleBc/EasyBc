const Candidate = require("../data/candidate")
const nodes = require("../../nodes")
const util = require("../../../utils")
const {postConsensusCandidate, postBatchConsensusCandidate} = require("../chat")
const async = require("async")
const {RIPPLE_STATE_CANDIDATE_AGREEMENT, RIPPLE_STATE_TIME_AGREEMENT, ROUND_NUM, SEND_DATA_DEFER, CANDIDATE_AGREEMENT_STATE_ROUND1, CANDIDATE_AGREEMENT_STATE_ROUND2, CANDIDATE_AGREEMENT_STATE_ROUND3} = require("../../constant")
const {SUCCESS, PARAM_ERR, OTH_ERR, STAGE_INVALID} = require("../../../const")

const log4js= require("../../logConfig");
const logger = log4js.getLogger();
const errLogger = log4js.getLogger("err");
const othLogger = log4js.getLogger("oth");

const ROUND1_THRESHHOLD = 0.5
const ROUND2_THRESHHOLD = 0.6
const ROUND3_THRESHHOLD = 0.8

class CandidateAgreement
{
	constructor(ripple)
	{
		const self = this;

		this.ripple = ripple;
		this.round = 0;
		this.ripple.express.post("/consensusCandidate", function(req, res) {
			if(!req.body.candidate) {
		        res.send({
		            code: PARAM_ERR,
		            msg: "param error, need candidate"
		        });
		        return;
		    }

		    if(!req.body.state) {
		        res.send({
		            code: PARAM_ERR,
		            msg: "param error, need state"
		        });
		        return;
		    }

		    // check stage
		    if(self.ripple.state !== req.body.state)
			{
				res.send({
	            	code: STAGE_INVALID,
	            	msg: `stage ${req.body.state} invalid, current stage is ${self.ripple.state}`
	        	});

				return;
			}

			res.send({
				code: SUCCESS,
				msg: ""
	      	});

		    processCandidate(self.ripple, req.body.candidate);
		});

		this.ripple.on("amalgamateOver", () => {
			logger.warn(`class CandidateAgreement, candidate consensus begin, round ${self.round}`);

			//
			self.round += 1;

			// clear invalid transactions
			if(self.round === 2 || self.round === 3 || self.round === 4)
			{
				logger.warn(`class CandidateAgreement, clear invalid transactions, round ${self.round - 1}`);
				self.ripple.candidate.clearInvalidTransaction(self.threshhold);
			}

			// check if stage is over
			if(self.round > ROUND_NUM)
			{
				logger.warn("class CandidateAgreement, candidate consensus is over, go to next stage");

				self.round = 0;
				// transfer to block agreement stage
				self.ripple.state = RIPPLE_STATE_TIME_AGREEMENT;
				self.ripple.emit("candidateAgreementOver");
				return;
			}

			// compute
			if(self.round === 1)
			{
				self.ripple.state = CANDIDATE_AGREEMENT_STATE_ROUND1;

				self.threshhold = ROUND1_THRESHHOLD;
			}

			if(self.round === 2)
			{
				self.ripple.state = CANDIDATE_AGREEMENT_STATE_ROUND2;

				self.threshhold = ROUND2_THRESHHOLD;
			}

			if(self.round === 3)
			{
				self.ripple.state = CANDIDATE_AGREEMENT_STATE_ROUND3;

				self.threshhold = ROUND3_THRESHHOLD;
			}

			// begin consensus
			self.run();
	  	});

	  	this.ripple.on("consensusCandidateInnerErr", data => {
			// check stage
			if(self.ripple.state !== data.state)
			{
				return;
			}

			setTimeout(() => {
				postConsensusCandidate(self.ripple, data.url, self.ripple.candidate);
			}, SEND_DATA_DEFER);
			
		});

	  	this.ripple.on("consensusCandidateErr", data => {
		  	// check stage
		  	if(self.ripple.state !== data.state)
			{
				return;
			}

			setTimeout(() => {
				postConsensusCandidate(self.ripple, data.url, self.ripple.candidate);
			}, SEND_DATA_DEFER);
		});

		this.ripple.on("consensusCandidateSuccess", data => {
			// do not check stage
			self.ripple.recordActiveNode(nodes.address);

			// check if mandatory time window is end
			if(self.ripple.timeout)
			{
				return;
			}

			// check and transfer to next round
			if(nodes.checkIfAllNodeHasMet(self.ripple.activeNodes))
			{
				logger.warn("Class CandidateAgreement consensusCandidateSuccess, candidate consensus is over, go to next round");

				self.ripple.emit("amalgamateOver");
			}
		});
	}

	/**
	 * transactions consensus, note!!! this is a private func, please no not call it
	 */
	run()
	{
		const self = this;

		// reset active nodes
		self.ripple.activeNodes = [];

		sendCandidate(this.ripple);

		this.ripple.initTimeout(() => {
			self.ripple.timeout = null;

			// check stage
			if(self.ripple.state !== CANDIDATE_AGREEMENT_STATE_ROUND1 && self.ripple.state !== CANDIDATE_AGREEMENT_STATE_ROUND2 && self.ripple.state !== CANDIDATE_AGREEMENT_STATE_ROUND3)
			{
				return;
			}

			// check and transfer to next round
			if(nodes.checkIfAllNodeHasMet(self.ripple.activeNodes))
			{
				logger.warn("Class CandidateAgreement initTimeout, candidate consensus is over, go to next round");

				self.ripple.emit("amalgamateOver");
			}
		});
	}
}

function sendCandidate(ripple)
{	
	// encode tranasctions
	ripple.candidate.poolDataToCandidateTransactions();
	//
	postBatchConsensusCandidate(ripple);
}

function processCandidate(ripple, candidate)
{
	logger.warn("Class CandidateAgreement processCandidate");

	candidate = new Candidate(candidate);

	// check candidate
	let errors = candidate.validateSignatrue(true);
	if(!!errors === true)
	{
		logger.error(`class CandidateAgreement, candidate ripple.recordActiveNode(time.from); is failed, ${errors}`);
	}
	else
	{
		ripple.recordActiveNode(candidate.from);

		// record transactions
		candidate.candidateTransactionsToPoolData();
		ripple.candidate.batchPush(candidate.data);
	}

	// check if mandatory time window is end
	if(ripple.timeout)
	{
		return;
	}

	// check and transfer to next round
	if(nodes.checkIfAllNodeHasMet(ripple.activeNodes))
	{
		logger.warn("Class CandidateAgreement processCandidate, candidate consensus is over, go to next round");

		ripple.emit("amalgamateOver");
	}
}

module.exports = CandidateAgreement;