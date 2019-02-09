const RippleBlock = require("../data/rippleBlock")
const Block = require("../../../block")
const util = require("../../../utils")
const {postConsensusBlock, postBatchConsensusBlock} = require("../chat")
const {RIPPLE_STATE_BLOCK_AGREEMENT, RIPPLE_STATE_EMPTY, SEND_DATA_DEFER} = require("../../constant")
const {SUCCESS, PARAM_ERR, OTH_ERR, STAGE_INVALID} = require("../../../const")
const Stage = require("./stage")
const async = require("async")

const log4js= require("../../logConfig");
const logger = log4js.getLogger();
const errLogger = log4js.getLogger("err");
const othLogger = log4js.getLogger("oth");

const ERR_SERVER_RUN_BLOCK_ERR = 1;

class BlockAgreement extends Stage
{
	constructor(ripple)
	{
		super(ripple);

		const self = this;

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
			console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
			res.send({
				code: SUCCESS,
				msg: ""
			});
      
			self.receive(req.body.rippleBlock);
		});

		this.ripple.on("timeAgreementOver", ()=> {
			self.ripple.stage = RIPPLE_STATE_BLOCK_AGREEMENT;

			self.run();
		})

		this.ripple.on("consensusBlockInnerErr", data => {
			setTimeout(() => {
				postConsensusBlock(self.ripple, data.node, self.ripple.rippleBlock);
			}, SEND_DATA_DEFER);
		});

		this.ripple.on("consensusBlockErr", data => {
			setTimeout(() => {
				postConsensusBlock(self.ripple, data.node, self.ripple.rippleBlock);
			}, SEND_DATA_DEFER);
		});

		this.ripple.on("consensusBlockSuccess", data => {
			self.recordAccessedNode(data.node.address);

			// check if mandatory time window is end
			if(!this.checkIfTimeoutEnd())
			{
				return;
			}
			
			self.tryToEnterNextStage();
		});
	}

	run()
	{
		const self = this;

		this.send();

		this.initTimeout();
	}

	send()
	{
		const self = this;

		let block = new Block({
			header: {
				timestamp: this.ripple.time.getTime()
			}, 
			transactions: this.ripple.candidate.data
		});
		async.waterfall([
			function(cb) {
				block.genTxTrie(cb);
			},
			function(cb) {
				// init txsTrie
				block.header.transactionsTrie = block.txTrie.root;

				self.ripple.processor.blockChain.getLastestBlockNumber(cb);
			},
			function(bnLastestBlockNumber, cb)
			{	
				// init block number
				block.header.number = bnLastestBlockNumber.addn(1);

				// init block
				self.ripple.rippleBlock.block = block.serialize();
				// record block
				self.ripple.rippleBlock.push(block);

				postBatchConsensusBlock(self.ripple);

				cb();
			}], err => {
				if(!!err) 
				{
					throw new Error("class BlockAgreement sendBlock, " + err);
				}
			});
	}

	receive(rippleBlock)
	{
		rippleBlock = new RippleBlock(rippleBlock);

		// check rippleBlock
		let errors = rippleBlock.validateSignatrue(true)
		if(!!errors == true)
		{
			logger.error(`class BlockAgreement, receive is failed, ${errors}`);
		}
		else
		{
			this.recordActiveNode(util.baToHexString(rippleBlock.from));

			// record
			this.ripple.rippleBlock.push(new Block(rippleBlock.block));
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
		// check and transfer to next round
		if(this.checkIfCanEnterNextStage())
		{
			this.ripple.state = RIPPLE_STATE_EMPTY;

			let consistentBlock = this.ripple.rippleBlock.getConsistentBlocks();

			// block consensus failed, do not clear candidate, begin new consensus
			if(consistentBlock === null)
			{
				this.ripple.run(false);
				return;
			}

			// block consensus success, run block
			riplle.processor.processBlock({generate: true}, consistentBlock, () => {
				this.ripple.run(true);
			});
		}
	}
}

module.exports = BlockAgreement;