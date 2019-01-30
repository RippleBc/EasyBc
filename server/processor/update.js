const {batchGetBlockByNum, batchGetLastestBlock} = require("../chat")
const async = require("async")
const Block = require("../../block")
const {getNodeNum} = require("./nodes")
const util = require("../../utils")

const Buffer = util.Buffer;
const BN = util.BN;

class Update
{
	constructor(processor)
	{
		const self = this;

		this.processor = processor;

		this.blocks = [];
		this.localLastestBlock = null;

		this.processor.on("getBlockByNumSuccess", rawBlock => {
			self.blocks.push(Buffer.from(rawBlock, "hex"));
			updateBlocks();
		});

		this.processor.on("getBlockByNumErr", () => {
			updateBlocks();
		});
	}

	run()
	{
		const self = this;

		this.blocks = [];
		this.localLastestBlock = null;

		this.initBlockChainState(() => {
			batchGetBlockByNum(self.processor);
		});
	}

	/**
	 * 
	 */
	initBlockChainState(cb)
	{
		const self = this;

		// get lastest block number
		self.processor.blockChain.getLastestBlockNumber(function(err, bnNumber) {
			if(!!err)
			{
				throw new Error("class Processor initBlockChainState, getLastestBlockNumber err " + err);
			}

			// genesis block
			if(bnNumber.eqn(0))
			{
				return cb();
			}

			getLastestBlockState(bnNumber, cb);
		});

		function getLastestBlockState(bnNumber, cb)
		{
			self.processor.blockChain.getBlockByNumber(bnNumber, (err, block) => {
				if(!!err)
				{
					throw new Error("class Processor initBlockChainState, getLastestBlockState err " + err);
				}
				//
				self.localLastestBlock = block;

				// init new state root
				let db = initDb();
				let trie = new Trie(db, block.header.stateRoot);

				// init block
				self.processor.blockChain = new BlockChain({stateTrie: trie});

				cb();
			});
		}
	}

	/**
	 *
	 */
	updateBlocks()
	{
		if(this.lastestRawBlocks.length < getNodeNum())
		{
			return;
		}

		let blocks;
		for(let i = 0; i < this.lastestRawBlocks.length; i++)
		{
			if(!blocks[this.lastestRawBlocks[i]])
			{
				blocks[this.lastestRawBlocks[i]] = 0;
			}
			
			blocks[this.lastestRawBlocks[i]] += 1;
		}

		// choose the max block
		let tmp = 0;
		let rawBlock;
		for(let key in blocks)
		{
			if(blocks[key] > tmp)
			{
				tmp = blocks[key];
				rawBlock = key;
			}
		}

		//update block
		let bnIndex = new BN(this.localLastestBlock.header.number);
		let bnLastestBlockNumber = new BN((new Block(rawBlock)).header.number)
		whilst(() => {
			return bnLastestBlockNumber.lt(bnIndex);
		})
	}

	getBlocksAndRun()
}