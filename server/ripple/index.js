const Pool = require("../processor/pool")
const async = require("async")
const semaphore = require("semaphore")
const AsyncEventEmitter = require("async-eventemitter")
const {RIPPLE_STATE_AMALGAMATE, RIPPLE_STATE_CANDIDATE_AGREEMENT, RIPPLE_STATE_BLOCK_AGREEMENT, ROUND_DEFER} = require("../constant")

const ROUND1_THRESHHOLD = 0.5
const ROUND2_THRESHHOLD = 0.6
const ROUND3_THRESHHOLD = 0.8

class Ripple extends AsyncEventEmitter
{
	constructor(expressApp)
	{
		super();

		this.expressApp = expressApp;

		this.state;

		this.activeNodes = [];
		this.timeout = null;

		this.candidatesPoolSem = semaphore(1);
		this.amalgamate = new Amalgamate(this);
		this.candidateAgreement = new CandidateAgreement(this);
		this.blockAgreement = new BlockAgreement(this);

		this.candidatesPool = new Pool(100);
	}

	/**
	 * @param {Number} threshhold
	 */
	round(threshhold, cb)
	{

	}

	run(cb)
	{
		async.waterfall([
			function(cb)
			{
				round(ROUND1_THRESHHOLD, cb);
			},
			function(cb)
			{
				round(ROUND2_THRESHHOLD, cb);
			},
			function(cb)
			{
				round(ROUND3_THRESHHOLD, cb);
			}], cb);
	}

	/**
	 * @param {Buffer} address
	 */
	recordActiveNode(address)
	{
		for(let i = 0; i < this.activeNodes.length; i++)
		{
			if(util.baToHexString(address) === this.activeNodes[i])
			{
				return;
			}
		}

		this.activeNodes.push(address);
	}

	initTimeout(func)
	{
		self.ripple.timeout = self.ripple.setTimeout(func, ROUND_DEFER);
	}
}