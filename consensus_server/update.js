const Block = require("../../depends/block");
const BlockChain = require("../../depends/block_chain");
const request = require("request");
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../../constant");
const initDb = require("../../db");
const Trie = require("merkle-patricia-tree");
const utils = require("../../depends/utils");
const AsyncEventEmitter = require("async-eventemitter");

const log4js= require("../logConfig")
const logger = log4js.getLogger("update")

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
		// recording block update is proceeding
		this.isUpdating = false;

		this.on("getBlockByNumberSuccess", rawBlock => {
			self.updatingBlocks.push(rawBlock);
			self.updateBlocks();
		});

		this.on("getBlockByNumberErr", () => {
			self.updateBlocks();
		});
	}

	run()
	{
		logger.warn("********************run begin********************");

		const self = this;

		// check if is updating
		if(this.isUpdating)
		{
			logger.warn("********************run is proceeding, do not call again********************");
			return;
		}

		this.updatingBlocks = [];
		this.localLastestBlockNumber = null;
		this.isUpdating = true;

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
				// init localLastestBlockNumber, used for sync block
				self.localLastestBlockNumber = util.toBuffer(bnNumber);

				// init block chain
				let db = initDb();
				let trie = new Trie(db);

				self.processor.blockChain = new BlockChain({stateTrie: trie});

				//
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

				// init localLastestBlockNumber, used for sync block
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
		logger.warn("****************begin to update blocks****************");

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
			logger.warn("****************Class update, update is over****************");
			this.isUpdating = false;
			return;
		}

		// get the majority block
		let rawNumblocks = {};
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

		// update block
		let block = new Block(rawBlock);
		async.waterfall([
			function(cb) {
				block.validate(self.processor.blockChain, cb);
			},
			function(cb) {
				//log env
				logger.warn("********************update block********************");
				logger.warn(`Update, current stateTrie: ${util.baToHexString(self.processor.blockChain.stateManager.trie.root)}`);
				logger.warn(`Update, current lastest block number: ${util.baToHexString(self.localLastestBlockNumber)}`);

				// log block info
				logger.warn(`Update, block info, parentHash: ${util.baToHexString(block.header.parentHash)}`);
				logger.warn(`Update, block info, transactionsTrie: ${util.baToHexString(block.header.transactionsTrie)}`);
				logger.warn(`Update, block info, stateTrie: ${util.baToHexString(block.header.stateRoot)}`);
				logger.warn(`Update, block info, number: ${util.baToHexString(block.header.number)}`);

				for(let i = 0; i < block.transactions.length; i++)
				{
					logger.warn(`Update, block info, transaction: ${JSON.stringify(block.transactions[i].toJSON(true))}`);
				}

				// process block
				self.processor.processBlock({generate: false}, block, () => {
					// update lastest block number
					self.localLastestBlockNumber = block.header.number;
					// add block number
					let bnNumber = new BN(self.localLastestBlockNumber).addn(1);
					// clear blocks
					self.updatingBlocks = [];

					self.batchGetBlockByNumber(util.toBuffer(bnNumber));
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