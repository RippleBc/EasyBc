const Transaction = require("../../transaction")
const Block = require("../../block")
const BlockChain = require("../../block_chain")
const util = require("util")
const FlowStoplight = require("flow-stoplight")
const async = require("async")
const Pool = require("../ripple/data/pool")
const Trie = require("merkle-patricia-tree/secure.js")
const initDb = require("../../db")
const {ERR_RUN_BLOCK_TX_PROCESS} = require("../../const")
const {TRANSACTION_CACHE_MAX_NUM} = require("../constant")

const log4js= require("../logConfig");
const logger = log4js.getLogger();
const errLogger = log4js.getLogger("err");
const othLogger = log4js.getLogger("oth");

/**
 * Creates a new processor object
 *
 * @class
 * @constructor
 * @prop 
 */
class Processor
{
	constructor(express)
	{
		const self = this;

		this.express = express;
		this.stoplight = new FlowStoplight();
		this.blockChain = new BlockChain();

		this.consensus = new Consensus(self, express);

		this.transactionsPool = new Pool(100);

		initBlockChainState(self);
	}

	run()
	{
		const self = this;

		this.stoplight.await(function() {
			self.consensus.run();
		});
	}

	/**
	 * reset stateManager
	 */
	reset()
	{
		initBlockChainState(this);
	}


	/**
	 * @param {Buffer|String|Array|Object}
	 */
	processTransaction(transaction, cb)
	{
		const self = this;
		self.stoplight.await(function() {
			if(self.transactionsPool.length > TRANSACTION_CACHE_MAX_NUM)
			{
				return cb("transactionCache is full");
			}

			try
			{
				// check transaction
				transaction = new Transaction(transaction);

				let errString = transaction.validate(true);
				if(errString !== "")
				{
					return cb(errString);
				}
			}
			catch(e)
			{
				return cb(e);
			}

			logger.info("receive transaction, hash: " + transaction.hash(true).toString("hex") + ", transaction: " + JSON.stringify(transaction.toJSON(true)));

			// push to transaction pool
			self.transactionsPool.push(transaction);

			cb();
		});
	}

	/**
	 * 
	 */
	processBlock()
	{
		const ERR_SERVER_RUN_BLOCK_ERR = 1;

		const self = this;

		let rawHeader = {
			parentHash: Buffer.alloc(32),
			stateRoot: Buffer.alloc(32),
			transactionsTrie: Buffer.alloc(32),
			number: 0,
			timestamp: Date.now(),
			extraData: Buffer.alloc(0)
		};

		let block;

		async.waterfall([
			function(cb) {
				// get lastest block number
				self.blockChain.getLastestBlockNumber(cb);
			},
			function(lastestBlockNumber, cb) {
				// init block number
				rawHeader.number = lastestBlockNumber.addn(1);

				// get lastest block hash
				self.blockChain.getBlockHashByNumber(lastestBlockNumber, cb);
			},
			function(parentHash, cb) {
				// init parantHash
				if(parentHash)
				{
					rawHeader.parentHash = parentHash;
				}
				
				// init block
				let rawBLock = {header: rawHeader, transactions: []};
				rawBLock.transactions = candidate.slice(0, candidate.length);

				logger.info("processing transaction: ")
				for(let i = 0; i < rawBLock.transactions.length; i++)
				{
					logger.info("hash: " + rawBLock.transactions[i].hash(true).toString("hex") + ", transaction: " + JSON.stringify(rawBLock.transactions[i].toJSON(true)));
				}

				block = new Block(rawBLock);

				// generate transactionsTrie
				block.genTxTrie(cb);
			},
			function(cb) {
				// init transactionsTrie
				block.header.transactionsTrie = block.txTrie.root;

				// run block and init stateRoot
				// skipNonce: true
				self.blockChain.runBlock({block: block, generate: true, skipNonce: true}, function(err, errCode, failedTransactions) {
					if(!!err)
					{
						if(errCode === ERR_RUN_BLOCK_TX_PROCESS)
						{						
							errLogger.error("failed transactions: ")
							for(let i = 0; i < failedTransactions.length; i++)
							{
								errLogger.error("hash: " + failedTransactions[i].hash(true).toString("hex") + ", transaction: " + JSON.stringify(failedTransactions[i].toJSON(true)));
							}

							// process failed transaction
							self.candidate.batchDel(failedTransactions, function() {
								cb(ERR_SERVER_RUN_BLOCK_ERR);
							});
							return;
						}
						
						return cb(ERR_SERVER_RUN_BLOCK_ERR);
					}
					
					cb();
				});
			},
			function(cb) {
				self.blockChain.putBlock(block, cb);
			}], function(err) {
				if(err === ERR_SERVER_RUN_BLOCK_ERR)
				{
					self.processBlock();
					return;
				}

				if(!!err)
				{
					throw new Error("server processBlock err, " + err);
				}

				self.consensus.run();
			});
	}
}

module.exports = Processor;