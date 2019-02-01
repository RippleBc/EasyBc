const async = require("async")
const Block = require("../../block")
const {getNodeNum, nodeList} = require("../nodes")
const util = require("../../utils")
const {post} = require("../../http/request")
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../../const")
const AsyncEventEmitter = require("async-eventemitter")
const initDb = require("../../db")
const Trie = require("merkle-patricia-tree/secure.js")
const BlockChain = require("../../block_chain")

const log4js= require("../logConfig")
const logger = log4js.getLogger()
const errlogger = log4js.getLogger("err")
const othlogger = log4js.getLogger("oth")

const Buffer = util.Buffer;
const BN = util.BN;

class Update extends AsyncEventEmitter
{
	constructor(processor)
	{
		super();

		const self = this;

		this.processor = processor;

		// record reponse node num
		this.activeNodes = 0;
		// record reponse block
		this.updatingBlocks = [];
		// record lastest block number
		this.localLastestBlockNumber = null;

		this.on("getBlockByNumberSuccess", rawBlock => {
			self.updatingBlocks.push(rawBlock);
			updateBlocks();
		});

		this.on("getBlockByNumberErr", () => {
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
			self.batchGetBlockByNumber(util.toBuffer(bnNumber));
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
				self.processor.stoplight.go();
				return cb();
			}

			getLastestBlockState(bnNumber, cb);
		});

		function getLastestBlockState(bnNumber, cb)
		{
			self.processor.blockChain.getBlockByNumber(bnNumber, (err, block) => {
				if(!!err)
				{
					throw new Error(`class Processor initBlockChainState, getLastestBlockState ${err}`);
				}

				if(block === null)
				{
					throw new Error("class Processor initBlockChainState, getLastestBlockState no corresponding block");
				}
				//
				self.localLastestBlockNumber = block.header.number;

				// init block chain
				let db = initDb();
				let trie = new Trie(db, block.header.stateRoot);
				self.processor.blockChain = new BlockChain({stateTrie: trie});

				//
				self.processor.stoplight.go();
				cb();
			});
		}
	}

	/**
	 *
	 */
	updateBlocks()
	{
		const self = this;

		this.activeNodes++;

		// wait for all nodes
		if(this.activeNodes < getNodeNum())
		{
			return;
		}

		// check if there is new block
		if(this.updatingBlocks.length === 0)
		{
			return;
		}

		// get the majority block
		let rawNumblocks;
		for(let i = 0; i < this.updatingBlocks.length; i++)
		{
			if(!rawNumblocks[this.updatingBlocks[i]])
			{
				rawNumblocks[this.updatingBlocks[i]] = 0;
			}
			
			rawNumblocks[this.updatingBlocks[i]]++;
		}

		// choose the max block
		let tmp = 0;
		let rawBlock;
		for(let raw in rawNumblocks)
		{
			if(rawNumblocks[raw] > tmp)
			{
				tmp = rawNumblocks[raw];
				rawBlock = raw;
			}
		}
		
		//
		let block = new Block(rawBlock);
		async.waterfall([
			function(cb) {
				block.validate(self.processor.blockChain, cb);
			},
			function(cb) {
				// process block
				this.processor.processBlock({generate: false}, block, () => {
					// update lastest block number
					self.localLastestBlockNumber = block.header.number;
					//
					let bnNumber = new BN(self.localLastestBlockNumber).addn(1);
					batchGetBlockByNumber(util.toBuffer(bnNumber));
				});
			}], err => {
				if(!!err)
				{
					throw new Error(`class Update updateBlocks ${err}`);
				}
			})
	}

	/**
	 * @param {Buffer} number
	 */
	batchGetBlockByNumber(number)
	{
		const self = this;

		nodeList.forEach(function(node) {
			self.getBlockByNumber(node.url, number, function(err, response) {
				if(!!err)
				{
					self.emit("getBlockByNumberErr");
					return;
				}

				if(response.code !== SUCCESS)
				{
					self.emit("getBlockByNumberErr");
					return;
				}

				self.emit("getBlockByNumberSuccess", response.data);
			});
		});
	}

	/**
	 * @param {Buffer} number the number of the block
	 */
	getBlockByNumber(url, number, cb)
	{
		post(logger, url + "/getBlockByNumber", {number: util.baToHexString(number)}, cb);
	}
}

module.exports = Update;