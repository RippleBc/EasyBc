const nodes = require("../nodes")
const RippleBlock = require("../data/rippleBlock")
const Block = require("../../../block")
const util = require("../../utils")
const {batchConsensusBlock} = require("../chat")
const {RIPPLE_STATE_BLOCK_AGREEMENT} = require("../constant")
const FlowStoplight = require("flow-stoplight")

const ERR_SERVER_RUN_BLOCK_ERR = 1;

class BlockAgreement
{
	constructor(ripple)
	{
		this.ripple = ripple;
		this.stoplight = new FlowStoplight();

		this.ripple.express.post("/consensusBlock", function(req, res) {
			if(!req.body.rippleBlock) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need rippleBlock"
        });
        return;
	    }

	    // vote
	    processBlock(self.ripple, req.body.rippleBlock);
		});

		this.ripple.on("timeAgreementOver", ()=> {
			run();
		})
	}

	run()
	{
		const self = this;

		// vote
		sendBlock(this.ripple);

		this.ripple.initTimeout(() => {
			// check round stage
			if(self.ripple.state !== RIPPLE_STATE_BLOCK_AGREEMENT)
			{
				return;
			}

			this.timeout = null;

			// check and transfer to next round
			if(nodes.checkIfAllNodeHasMet(self.ripple.activeNodes))
			{
				// get consistent block
				ripple.processor.consistentBlock = ripple.rippleBlock.getConsistentBlocks();
				//
				ripple.state = RIPPLE_STATE_EMPTY;
				riplle.processor.processBlock();
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

			// get lastest block number
			self.blockChain.getLastestBlockNumber(cb);
		},
		function(bnLastestBlockNumber, cb)
		{
			// init block number
			block.header.number = bnLastestBlockNumber.addn(1);

			ripple.rippleBlock.block = block.serialize();

			batchConsensusBlock(ripple);
		}], err => {
			if(!!err) 
			{
				throw new Error("class BlockAgreement sendBlock, " + err);
			}
		});
}

function processBlock(ripple, rippleBlock)
{
	// check state
	if(ripple.state !== RIPPLE_STATE_BLOCK_AGREEMENT)
	{
		return;
	}

	// check rippleBlock
	rippleBlock = new RippleBlock(rippleBlock);
	if(!rippleBlock.validate())
	{
		return;
	}

	ripple.recordActiveNode(rippleBlock.from);

	// record
	ripple.rippleBlock.push(new Block(rippleBlock.block));

	// check if mandatory time window is end
	if(ripple.timeout)
	{
		return;
	}

	// check and transfer to next round
	if(nodes.checkIfAllNodeHasMet(self.ripple.activeNodes))
	{
		// get consistent block
		ripple.processor.consistentBlock = ripple.rippleBlock.getConsistentBlocks();
		//
		ripple.state = RIPPLE_STATE_EMPTY;
		riplle.processor.processBlock();
	}
}


