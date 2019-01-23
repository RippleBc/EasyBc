const Transaction = require("../../transaction")
const Block = require("../../block")
const BlockChain = require("../../block_chain")
const Consensus = require("../consensus")
const util = require("util")
const AsyncEventEmitter = require("async-eventemitter")
const FlowStoplight = require("flow-stoplight")
const semaphore = require("semaphore")
const async = require("async")
const Pool = require("./pool")
const Trie = require("merkle-patricia-tree/secure.js")
const initDb = require("../../db")
const {ERR_RUN_BLOCK_TX_PROCESS, ERR_RUN_BLOCK_TXS_SIZE, ERR_RUN_BLOCK_TXS_TRIE_STATE} = require("../../const")

const log4js= require("../logConfig");
const logger = log4js.getLogger();
const errLogger = log4js.getLogger("err");
const othLogger = log4js.getLogger("oth");

const BLOCK_TRANSACTIONS_SIZE_LIMIT = 2;

const ERR_SERVER_TRANSACTION_SIZE_NOT_REACH = 1;
const ERR_SERVER_RUN_BLOCK_ERR = 2;

/**
 * Creates a new processor object
 *
 * @class
 * @constructor
 * @prop 
 */
class Processor extends AsyncEventEmitter
{
	constructor()
	{
		super();

		const self = this;

		this.transactionsPoolSem = semaphore(1);
		this.consistentTransactionsPoolSem = semaphore(1);
		this.stoplight = new FlowStoplight();
		this.blockChain = new BlockChain();

		this.consensus = new Consensus(self);
		this.transactionsPool = new Pool(100);
		this.consistentTransactionsPool = new Pool(100);

		this.on("consistentTransaction", function(err, next) {
				processBlock(self);
				next();		
		});

		initBlockChainState(self);
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
		console.log("asdffffffffffffffff")
		self.stoplight.await(function() {
			console.log("********************")
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

			self.transactionsPoolSem.take(function(semaphoreLeaveFunc) {

				// push to transaction pool
				self.transactionsPool.push(transaction, function(err) {

					self.transactionsPoolSem.leave();

					if(!!err)
					{
						return cb(err);
					}

					self.emit("transaction");
					cb();
				});
			});
		});
	}
}

/**
 * Init stateTrie
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
			console.log("456")
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
 * @param {Block} block 
 */
function processBlock(processor)
{
	let waitingProcessTransactionSize;

	let rawHeader = {
		parentHash: Buffer.alloc(32),
		stateRoot: Buffer.alloc(32),
		transactionsTrie: Buffer.alloc(32),
		number: 0,
		timestamp: Date.now(),
		extraData: Buffer.alloc(0),
		transactionSizeLimit: BLOCK_TRANSACTIONS_SIZE_LIMIT
	};

	let block;

	async.waterfall([
		function(cb) {
			// lock
			processor.consistentTransactionsPoolSem.take(function(semaphoreLeaveFunc){
				cb();
			});
		},
		function(cb) {
			if(processor.consistentTransactionsPool.length < BLOCK_TRANSACTIONS_SIZE_LIMIT)
			{
				return cb(ERR_SERVER_TRANSACTION_SIZE_NOT_REACH);
			}

			waitingProcessTransactionSize = processor.consistentTransactionsPool.length < BLOCK_TRANSACTIONS_SIZE_LIMIT ? processor.consistentTransactionsPool.length : BLOCK_TRANSACTIONS_SIZE_LIMIT;
			cb();
		},
		function(cb) {
			// get lastest block number
			processor.blockChain.getLastestBlockNumber(cb);
		},
		function(lastestBlockNumber, cb) {
			// init block number
			rawHeader.number = lastestBlockNumber.addn(1);

			// get lastest block hash
			processor.blockChain.getBlockHashByNumber(lastestBlockNumber, cb);
		},
		function(parentHash, cb) {
			// init parantHash
			if(parentHash)
			{
				rawHeader.parentHash = parentHash;
			}
			
			// init block
			let rawBLock = {header: rawHeader, transactions: []};
			rawBLock.transactions = processor.consistentTransactionsPool.slice(0, waitingProcessTransactionSize);

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
			processor.blockChain.runBlock({block: block, generate: true, skipNonce: true}, function(err, errCode, failedTransactions) {
				if(!!err)
				{
					if(errCode === ERR_RUN_BLOCK_TX_PROCESS)
					{
						// log
						errLogger.error(err);
						errLogger.error("failed transactions: ")
						for(let i = 0; i < failedTransactions.length; i++)
						{
							errLogger.error("hash: " + failedTransactions[i].hash(true).toString("hex") + ", transaction: " + JSON.stringify(failedTransactions[i].toJSON(true)));
						}

						// process failed transaction
						processor.consistentTransactionsPool.delBatch(failedTransactions, function() {
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
			processor.blockChain.putBlock(block, cb);
		},
		function(cb) {
			processor.consistentTransactionsPool.splice(0, waitingProcessTransactionSize, cb);
		}], function(err) {
			// release semaphore
			processor.consistentTransactionsPoolSem.leave();

			if(err === ERR_SERVER_TRANSACTION_SIZE_NOT_REACH)
			{
				return;
			}

			if(err === ERR_SERVER_RUN_BLOCK_ERR)
			{
				return;
			}

			// log
			if(!!err)
			{
				throw new Error("server processBlock err, " + err);
			}
		});
}

util.inherits(BlockChain, AsyncEventEmitter);

module.exports = Processor;