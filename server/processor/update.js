const {batchGetBlockByNum} = require("../chat")
const async = require("async")
const Block = require("../../block")
const {getNodeNum, nodeList} = require("./nodes")
const util = require("../../utils")
const {post} = require("../../http/request")
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../../const")

const log4js= require("../logConfig")
const logger = log4js.getLogger()
const errlogger = log4js.getLogger("err")
const othlogger = log4js.getLogger("oth")

const Buffer = util.Buffer;
const BN = util.BN;

class Update
{
	constructor(processor)
	{
		const self = this;

		this.processor = processor;

		this.updatingBlocks = [];
		this.localLastestBlockNumber = null;

		this.processor.on("getBlockByNumSuccess", rawBlock => {
			self.updatingBlocks.push(rawBlock);
			updateBlocks();
		});

		this.processor.on("getBlockByNumErr", () => {
			updateBlocks();
		});
	}

	run()
	{
		const self = this;

		this.updatingBlocks = [];
		this.localLastestBlockNumber = null;

		this.initBlockChainState(() => {
			let bnNumber = new BN(self.localLastestBlockNumber).addn(1);
			batchGetBlockByNum(self.processor, util.toBuffer(bnNumber));
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
				self.localLastestBlockNumber = block.header.number;

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
		if(this.updatingBlocks.length < getNodeNum())
		{
			return;
		}

		let blocks;
		for(let i = 0; i < this.updatingBlocks.length; i++)
		{
			if(!blocks[this.updatingBlocks[i]])
			{
				blocks[this.updatingBlocks[i]] = 0;
			}
			
			blocks[this.updatingBlocks[i]] += 1;
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
		
		// process block
		let block = new Block(rawBlock);
		this.processor.processBlock(block, () => {
			self.localLastestBlockNumber = block.header.number;
			//
			let bnNumber = new BN(self.localLastestBlockNumber).addn(1);
			batchGetBlockByNum(self.processor, util.toBuffer(bnNumber));
		});
	}
}

/**
 * @param {Buffer} number
 */
batchGetBlockByNum(processor, number)
{	
	nodeList.foreach(function(node) {
		module.exports.getBlockByNum(node.url, number, function(err, response) {
			if(!!err)
			{
				processor.emit("getBlockByNumErr");
				return;
			}

			if(response.code !== SUCCESS)
			{
				processor.emit("getBlockByNumErr");
				return;
			}

			processor.emit("getBlockByNumSuccess", response.data);
		});
	});
}

/**
 * @param {Buffer} number the number of the block
 */
getBlockByNum(url, number, cb)
{
	post(logger, url + "/getLatestByNum", {number: util.baToHexString(number)}, cb);
}

