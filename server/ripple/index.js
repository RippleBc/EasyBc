const async = require("async")
const semaphore = require("semaphore")
const AsyncEventEmitter = require("async-eventemitter")
const {RIPPLE_STATE_AMALGAMATE, BLOCK_AGREEMENT_MAX_ROUND} = require("../constant")
const Candidate = require("./data/candidate")
const Time = require("./data/time")
const RippleBlock = require("./data/rippleBlock")
const Amalgamate = require("./stage/amalgamate")
const CandidateAgreement = require("./stage/candidateAgreement")
const TimeAgreement = require("./stage/timeAgreement")
const BlockAgreement = require("./stage/blockAgreement")
const util = require("../../utils")

class Ripple extends AsyncEventEmitter
{
	constructor(processor, express)
	{
		super();

		this.processor = processor;
		this.express = express;

		// record ripple consensus stage
		this.state = null;
		//
		this.blockAgreementRound = 0;

		this.amalgamate = new Amalgamate(this);
		this.candidateAgreement = new CandidateAgreement(this);
		this.timeAgreement = new TimeAgreement(this);
		this.blockAgreement = new BlockAgreement(this);

		this.candidate = new Candidate();
		this.time = new Time();
		this.rippleBlock = new RippleBlock();
	}

	run(ifBlockAgreement)
	{
		this.blockAgreementRound ++;

		// reset stage
		this.amalgamate.reset();
		this.candidateAgreement.reset();
		this.timeAgreement.reset();
		this.blockAgreement.reset();

		// clear data
		this.time.reset();
		this.rippleBlock.reset();

		// run block success or run block continuous failed times is exceed the bound
		if(ifBlockAgreement || this.blockAgreementRound > BLOCK_AGREEMENT_MAX_ROUND)
		{
			this.blockAgreementRound = 1;
			// clear data
			this.candidate.reset();
		}

		// round begin
		this.amalgamate.run();

		this.state = RIPPLE_STATE_AMALGAMATE;
	}
}

module.exports = Ripple;