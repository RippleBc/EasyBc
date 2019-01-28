const Pool = require("../processor/pool")
const async = require("async")
const semaphore = require("semaphore")
const AsyncEventEmitter = require("async-eventemitter")
const {RIPPLE_STATE_AMALGAMATE, RIPPLE_STATE_CANDIDATE_AGREEMENT, RIPPLE_STATE_BLOCK_AGREEMENT, ROUND_DEFER} = require("../constant")

class Ripple extends AsyncEventEmitter
{
	constructor(processor, express)
	{
		super();

		this.processor = processor;
		this.express = express;

		// record ripple consensus stage
		this.state = null;
		// record the live node in the ripple consensus stage
		this.activeNodes = [];
		// timeout each stage of one round
		this.timeout = null;

		this.candidatesPoolSem = semaphore(1);

		this.amalgamate = new Amalgamate(this);
		this.candidateAgreement = new CandidateAgreement(this);
		this.blockAgreement = new BlockAgreement(this);

		this.transactionsPool = new Pool(100);
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

		return this.activeNodes;
	}

	/**
	 *
	 */
	initTimeout(func)
	{
		this.timeout = setTimeout(func, ROUND_DEFER);
	}
}