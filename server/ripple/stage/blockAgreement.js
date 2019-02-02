const {checkIfAllNodeHasMet} = require("../../nodes")
const RippleBlock = require("../data/rippleBlock")
const Block = require("../../../block")
const util = require("../../../utils")
const {postConsensusBlock, postBatchConsensusBlock} = require("../chat")
const {RIPPLE_STATE_BLOCK_AGREEMENT, RIPPLE_STATE_EMPTY, SEND_DATA_DEFER} = require("../../constant")
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../../../const")

const log4js= require("../../logConfig");
const logger = log4js.getLogger();
const errLogger = log4js.getLogger("err");
const othLogger = log4js.getLogger("oth");

const ERR_SERVER_RUN_BLOCK_ERR = 1;

class BlockAgreement
{
	constructor(ripple)
	{
		this.ripple = ripple;

		this.ripple.express.post("/consensusBlock", function(req, res) {
			if(!req.body.rippleBlock) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need rippleBlock"
        });
        return;
	    }

	    // check stage
			if(self.ripple.state !== RIPPLE_STATE_BLOCK_AGREEMENT)
			{
				res.send({
            code: STAGE_INVALID,
            msg: `param error, current stage is ${self.ripple.state}`
        });
				return;
			}

	    consensusBlock(self.ripple, req.body.rippleBlock);
		});

		this.ripple.on("timeAgreementOver", ()=> {
			run();
		})

		this.ripple.on("consensusBlockInnerErr", data => {
			// check stage
			if(self.ripple.state !== RIPPLE_STATE_BLOCK_AGREEMENT)
			{
				return;
			}

			setTimeout(() => {
				postConsensusBlock(self.ripple, data.url, self.ripple.block);
			}, SEND_DATA_DEFER);
			
		});

	  this.ripple.on("consensusBlockErr", data => {
	  	// check stage
			if(self.ripple.state !== RIPPLE_STATE_BLOCK_AGREEMENT)
			{
				return;
			}

			setTimeout(() => {
				postConsensusBlock(self.ripple, data.url, self.ripple.block);
			}, SEND_DATA_DEFER);
	  	
	  });
	}

	run()
	{
		const self = this;

		// reset active nodes
		self.ripple.activeNodes = [];

		// vote
		sendBlock(this.ripple);

		this.ripple.initTimeout(() => {
			// check round stage
			if(self.ripple.state !== RIPPLE_STATE_BLOCK_AGREEMENT)
			{
				return;
			}

			self.timeout = null;

			// check and transfer to next round
			if(checkIfAllNodeHasMet(self.ripple.activeNodes))
			{
				//
				ripple.state = RIPPLE_STATE_EMPTY;

				// block consensus failed, do not clear candidate, begin new consensus
				let consistentBlock = ripple.rippleBlock.getConsistentBlocks();
				if(consistentBlock === null)
				{
					self.ripple.run(false);
					return;
				}

				// block consensus success, run block
				riplle.processor.processBlock({generate: true}, consistentBlock, () => {
					self.ripple.run(true);
				});
			}
		});
	}
}

function sendBlock(ripple)
{
	let block = new Block({
		header: {
			timestamp: ripple.time.getTime()
		}, 
		transactions: ripple.candidate.data
	});

	async.waterfall([
		function(cb) {
			block.genTxTrie(cb);
		},
		function(cb) {
			// init txsTrie
			block.header.transactionsTrie = block.txTrie.root;

			self.blockChain.getLastestBlockNumber(cb);
		},
		function(bnLastestBlockNumber, cb)
		{
			// init block number
			block.header.number = bnLastestBlockNumber.addn(1);

			// init block
			ripple.rippleBlock.block = block.serialize();

			// record block
			ripple.rippleBlock.push(block);

			postBatchConsensusBlock(ripple);
		}], err => {
			if(!!err) 
			{
				throw new Error("class BlockAgreement sendBlock, " + err);
			}
		});
}

function consensusBlock(ripple, rippleBlock)
{
	rippleBlock = new RippleBlock(rippleBlock);

	// check rippleBlock
	let errors = rippleBlock.validateSignatrue(true)
	if(!!errors == true)
	{
		logger.info(`class BlockAgreement, rippleBlock ripple.recordActiveNode(time.from); is failed, ${errors}`);
	}
	else
	{
		ripple.recordActiveNode(rippleBlock.from);

		// record
		ripple.rippleBlock.push(new Block(rippleBlock.block));
	}
	

	// check if mandatory time window is end
	if(ripple.timeout)
	{
		return;
	}
	
	// check and transfer to next round
	if(checkIfAllNodeHasMet(ripple.activeNodes))
	{
		//
		ripple.state = RIPPLE_STATE_EMPTY;

		// block consensus failed, do not clear candidate, begin new consensus
		let consistentBlock = ripple.rippleBlock.getConsistentBlocks();
		if(consistentBlock === null)
		{
			ripple.run(false);
			return;
		}

		// block consensus success, run block
		riplle.processor.processBlock({generate: true}, consistentBlock, () => {
			ripple.run(true);
		});
	}
}

module.exports = BlockAgreement;