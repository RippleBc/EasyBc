const nodes = require("../nodes")
const Block = require("../data/block")
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
			if(!req.body.block) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need block"
        });
        return;
	    }

	    // vote
	    processBlock(self.ripple, req.body.block);
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

	block.genTxTrie(function(err) {
		if(!!err) 
		{
			throw new Error("class BlockAgreement sendBlock, " + err);
		}

		block.header.transactionsTrie = block.txTrie.root;

		ripple.block.block = block.hash();

		batchConsensusBlock(ripple);
	});
}

function processBlock(ripple, block)
{
	// check state
	if(ripple.state !== RIPPLE_STATE_BLOCK_AGREEMENT)
	{
		return;
	}

	ripple.recordActiveNode(block.from);

	// check block
	block = new Block(block);
	if(!block.validate())
	{
		return;
	}

	// record
	ripple.block.push(util.baToHexString(block.block));

	// check if mandatory time window is end
	if(ripple.timeout)
	{
		return;
	}

	// check and transfer to next round
	if(nodes.checkIfAllNodeHasMet(self.ripple.activeNodes))
	{
		ripple.state = RIPPLE_STATE_EMPTY;
		riplle.processor.processBlock();
	}
}


