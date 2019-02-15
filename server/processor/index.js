const Transaction = require("../../transaction")
const Block = require("../../block")
const BlockChain = require("../../block_chain")
const util = require("../../utils")
const FlowStoplight = require("flow-stoplight")
const async = require("async")
const Pool = require("../ripple/data/pool")
const {ERR_RUN_BLOCK_TX_PROCESS} = require("../../const")
const {TRANSACTION_CACHE_MAX_NUM} = require("../constant")
const Update = require("./update")
const Consensus = require("../consensus")

const log4js= require("../logConfig");
const logger = log4js.getLogger();
const errLogger = log4js.getLogger("err");
const othLogger = log4js.getLogger("oth");

const BN = util.BN;

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

		// use for manipulate block chain
		this.blockChain = new BlockChain();

		// used for transaction consensus
		this.consensus = new Consensus(self, express);

		// used for block sync
		this.update = new Update(self);

		// transactions cache
		this.transactionsPool = new Pool();
	}

	run()
	{
		const self = this;

		// update block chain
		self.update.run();

		// wait for the stateTrie init is ok
		this.stoplight.await(function() {
			// begin transaction consensus
			self.consensus.consensusInstance.run();
		});
	}


	/**
	 * @param {String}
	 */
	processTransaction(transaction, cb)
	{
		if(typeof transaction !== "string")
		{
			throw new Error(`class Processor processTransaction, argument transaction's type should be string, now is ${typeof transaction}`);
		}

		const self = this;

		// wait for the stateTrie init is ok
		self.stoplight.await(function() {
			if(self.transactionsPool.length > TRANSACTION_CACHE_MAX_NUM)
			{
				return cb("transactions cache is full");
			}

			try
			{
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

			logger.info(`receive transaction, hash: ${transaction.hash(true).toString("hex")}, transaction: ${JSON.stringify(transaction.toJSON(true))}`);

			self.transactionsPool.push(transaction);

			cb();
		});
	}

	/**
	 * @param {Boolean} opts.generate
	 * @param {Block} consistentBlock
	 */
	processBlock(opts, consistentBlock, cb)
	{
		if(consistentBlock instanceof Block === false)
		{
			throw new Error("class Processor processBlock, argument consistentBlock's type should be Block");
		}
		
		if(consistentBlock.transactions.length === 0)
		{
			// do not process block without transactions
			logger.info(`Class Processor, block ${util.baToHexString(consistentBlock.header.number)} has no transaction`);
			return cb();
		}

		const self = this;

		const ifGenerateStateRoot = !!opts.generate

		const ERR_SERVER_RUN_BLOCK_BLOCKS_UPDATING = 1;

		async.waterfall([
			function(cb) {
				let bnParentBlockNumber = new BN(consistentBlock.header.number).subn(1);

				// get block hash
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
					// check if consistentBlock is a genesis block
					if(new BN(consistentBlock.header.number).cmpn(1) !== 0)
					{
						logger.info("block chain's updating is not finish, begin to finish");

						// blockChain is behind the latest version, begin update 
						self.update.run();
						//
						return cb(ERR_SERVER_RUN_BLOCK_BLOCKS_UPDATING);
					}
				}

				logger.warn("################processing transaction: ################")
				for(let i = 0; i < consistentBlock.transactions.length; i++)
				{
					logger.warn("hash: " + consistentBlock.transactions[i].hash(true).toString("hex") + ", transaction: " + JSON.stringify(consistentBlock.transactions[i].toJSON(true)));
				}

				self.blockChain.runBlock({block: consistentBlock, generate: ifGenerateStateRoot, skipNonce: true}, function(err, failedTransactions) {
					if(!!err)
					{	
						errLogger.error("failed transactions: ")
						for(let i = 0; i < failedTransactions.length; i++)
						{
							errLogger.error("hash: " + failedTransactions[i].hash(true).toString("hex") + ", transaction: " + JSON.stringify(failedTransactions[i].toJSON(true)));
						}

						// delete valid transactions
						consistentBlock.delInvalidTransactions(failedTransactions);
						
						return cb(err);
					}
					
					cb();
				});
			},
			function(cb) {
				logger.warn("################update block: ################")
				logger.warn(`block number: ${util.baToHexString(consistentBlock.header.number)}, block hash: ${util.baToHexString(consistentBlock.hash())}`)

				self.blockChain.updateBlock(consistentBlock, cb);
			},
			function(cb) {
				self.blockChain.updateMaxBlockNumber(consistentBlock.header.number, cb);
			}], function(err) {
				// some transaction is invalid, del them and run again
				if(err === ERR_RUN_BLOCK_TX_PROCESS)
				{
					self.processBlock(opts, consistentBlock, cb);
					return;
				}

				// blocks is updating
				if(err === ERR_SERVER_RUN_BLOCK_BLOCKS_UPDATING)
				{
					return cb();
				}

				if(!!err)
				{
					throw new Error(`class Processor processBlock ${err}`);
				}

				logger.warn("################run block success################")

				cb();
			});
	}
}

module.exports = Processor;