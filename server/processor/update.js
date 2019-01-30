const {batchGetBlockByNum, batchGetLastestBlock} = require("../chat")
const async = require("async")
const Block = require("../../block")

class Update
{
	constructor(processor)
	{
		this.processor = processor;

		// record the live node in the update stage
		this.responseNodeNum = 0;
		this.lastestBlocks = [];
		this.blocks = [];
		this.localLastestBlock;
		
		this.processor.on("getLastestBlockSuccess", rawBlock => {
			this.lastestBlocks.push(new Block(rawBlock));
			responseNodeNum++;

			updateBlocks(processor)
		});

		this.processor.on("getLastestBlockErr", () => {
			responseNodeNum++;

			updateBlocks(processor)
		});
	}

	run()
	{
		responseNodeNum = 0;
		this.lastestBlocks = [];
		this.blocks = [];

		batchGetBlockByNum(this.processor);
	}
}

/**
 * 
 */
function initBlockChainState(processor)
{
	// get lastest block number
	processor.blockChain.getLastestBlockNumber(function(err, bnNumber) {
		if(!!err)
		{
			throw new Error("class Processor initBlockChainState, getLastestBlockNumber err " + err);
		}

		// genesis block
		if(bnNumber.eqn(0))
		{
			processor.stoplight.go();
			return;
		}

		getLastestBlockState(bnNumber);
	});

	function getLastestBlockState(bnNumber)
	{
		async.waterfall([
			function(cb) {
				// get latest block
				processor.blockChain.getBlockByNumber(bnNumber, cb);
			},
			function(block, cb) {
				// init new state root
				let db = initDb();
				let trie = new Trie(db, block.header.stateRoot);

				// init block
				processor.blockChain = new BlockChain({stateTrie: trie});
				cb();
			}], function(err) {
				if(!!err)
				{
					throw new Error("class Processor initBlockChainState, getLastestBlockState err " + err);
				}

				processor.stoplight.go();
			});
	}
}

/**
 *
 */
function updateBlocks = function(processor)
{
	
}