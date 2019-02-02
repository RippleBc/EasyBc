const {checkIfAllNodeHasMet} = require("../../nodes")
const RippleBlock = require("../data/rippleBlock")
const Block = require("../../../block")
const util = require("../../../utils")
const {postConsensusBlock, postBatchConsensusBlock} = require("../chat")
const {RIPPLE_STATE_BLOCK_AGREEMENT, RIPPLE_STATE_EMPTY} = require("../../constant")
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../../../const")

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

			postConsensusBlock(self.ripple, data.url, self.ripple.block);
		}

	  this.ripple.on("consensusBlockErr", data => {
	  	// check stage
			if(self.ripple.state !== RIPPLE_STATE_BLOCK_AGREEMENT)
			{
				return;
			}

	  	postConsensusBlock(self.ripple, data.url, self.ripple.block);
	  }
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
	// check state
	if(ripple.state !== RIPPLE_STATE_BLOCK_AGREEMENT)
	{
		return;
	}

	// check if mandatory time window is end
	if(ripple.timeout)
	{
		return;
	}

	ripple.recordActiveNode(rippleBlock.from);

	// check rippleBlock
	rippleBlock = new RippleBlock(rippleBlock);
	if(!rippleBlock.validate())
	{
		return;
	}

	// record
	ripple.rippleBlock.push(new Block(rippleBlock.block));

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
}

module.exports = BlockAgreement;