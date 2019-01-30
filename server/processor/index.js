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
	 * @param {Block} consistentBlock
	 */
	processBlock(consistentBlock, cb)
	{
		const ERR_SERVER_RUN_BLOCK_TRANSACTIONS_ERR = 1;
		const ERR_SERVER_RUN_BLOCK_BLOCKS_UPDATING = 2;

		const self = this;

		async.waterfall([
			function(cb) {
				let bnParentBlockNumber = new BN(consistentBlock.header.number).subn(1);

				// get lastest block hash
				self.blockChain.getBlockHashByNumber(bnParentBlockNumber, cb);
			},
			function(parentHash, cb) {
				// init parantHash
				if(parentHash)
				{
					consistentBlock.header.parentHash = parentHash;
				}
				else
				{
					// blocks is updating
					if(new BN(consistentBlock.header.number).neqn(1))
					{
						return cb(ERR_SERVER_RUN_BLOCK_BLOCKS_UPDATING);
					}
				}

				logger.info("processing transaction: ")
				for(let i = 0; i < consistentBlock.transactions.length; i++)
				{
					logger.info("hash: " + consistentBlock.transactions[i].hash(true).toString("hex") + ", transaction: " + JSON.stringify(consistentBlock.transactions[i].toJSON(true)));
				}

				// run block and init stateRoot
				// skipNonce: true
				self.blockChain.runBlock({block: consistentBlock, generate: true, skipNonce: true}, function(err, errCode, failedTransactions) {
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
								cb(ERR_SERVER_RUN_BLOCK_TRANSACTIONS_ERR);
							});
							return;
						}
						
						return cb(ERR_SERVER_RUN_BLOCK_TRANSACTIONS_ERR);
					}
					
					cb();
				});
			},
			function(cb) {
				self.blockChain.putBlock(block, cb);
			}], function(err) {
				// some transactions err
				if(err === ERR_SERVER_RUN_BLOCK_TRANSACTIONS_ERR)
				{
					self.processBlock();
					return;
				}

				// blocks is updating
				if(err === ERR_SERVER_RUN_BLOCK_BLOCKS_UPDATING)
				{
					return cb();
				}

				if(!!err)
				{
					throw new Error("server processBlock err, " + err);
				}

				cb();
			});
	}
}

module.exports = Processor;