const Transaction = require("../../Transaction")
const Block = require("../../block")
const BlockChain = require("../../block_chain")
const Consensus = require("../consensus")
const util = require("util")
const AsyncEventEmitter = require("async-eventemitter")
const FlowStoplight = require("flow-stoplight")
const async = require("async")
const Pool = rquire("./pool")
const Trie = require("merkle-patricia-tree/secure.js")
const initDb = require("../../db")

const BLOCK_TRANSACTIONS_SIZE_LIMIT = 10;
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

		this.stoplight = new FlowStoplight();
		processor.blockChain = new BlockChain();

		initBlockChainState(self);

		this.consensus = new Consensus(self);
		this.transactionsPool = new Pool(100);
		this.consistentTransactionsPool = new Pool(100);

		this.on("consistentTransaction", function(err, next) {
				processBlock(self);
				next();		
		});
	}
	/**
	 * @param {Buffer|String|Array|Object}
	 */
	processTransaction(transaction, cb)
	{
		const self = this;

		self.stoplight.await(function() {
			try
			{
				// check transaction
				let tranasction = new Transaction(tranasction);

				let errString = tranasction.validate(true);
				if(errString !== "")
				{
					return cb(errString);
				}
			}
			catch(e)
			{
				return cb(e);
			}

			self.transactionsPool.push(tranasction, functioin(err) {
				if(!!err)
				{
					return cb(err);
				}
				self.emit("transaction");
				cb();
			});
		});
	}
}


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
			self.stoplight.go();
			return;
		}

		getLastestBlockState(bnNumber)
	});


	function getLastestBlockState(bnNumber)
	{
		async.waterfall([
			function() {
				// get latest block
				processor.blockChain.getBlockByNumber(bnNumber, cb);
			},
			function(block, cb) {
				// init new state root
				let db = initDb();
				let trie = new Trie(db, block.header.stateRoot);

				// init block
				processor.blockChain = new BlockChain({stateTrie: trie});
			}], function(err) {
				if(!!err)
				{
					throw new Error("class Processor initBlockChainState, getLastestBlockState err " + err);
				}
				self.stoplight.go();
			});
	}
}

/**
 * @param {Block} block 
 */
function processBlock(processor)
{
	if(processor.transactionsPool.length < BLOCK_TRANSACTIONS_SIZE_LIMIT)
	{
		return;
	}

	const waitingProcessTransactionSize = processor.transactionsPool.length < BLOCK_TRANSACTIONS_SIZE_LIMIT ? processor.transactionsPool.length : BLOCK_TRANSACTIONS_SIZE_LIMIT;

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
			// get lastest block number
			processor.blockChain.getLastestBlockNumber(cb);
		},
		function(lastestBlockNumber, cb) {
			// init block number
			rawHeader.number = lastestBlockNumber;

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
			let rawBLock = [{header: rawHeader, transactions: []}];
			for(let i = 0; i < waitingProcessTransactionSize; i++)
			{
				rawBLock.transactions.push(processor.consistentTransactionsPool.get(i));
			}
			block = new Block(rawBLock);

			// generate transactionsTrie
			block.genTxTrie(cb);
		},
		function(cb) {
			// init transactionsTrie
			block.header.transactionsTrie = block.trie.root;

			// run block and init stateRoot
			processor.blockChain.runBlock({block: block, generate: true}, function(err, errCode, failedTransactions) {
				if(!!err && errCode === blockChain.TX_PROCESS_ERR)
				{
					for(let i = 0; i < failedTransactions.length; i++)
					{
						console.log("failedTransactions: index: " + i + ", hash: " + failedTransactions[i].hash(true).toString("hex"));
					}

					// process failed transaction
					processor.consistentTransactionsPool.delBatch(failedTransactions, cb);
					return;
				}
				cb(err);
			});
		},
		function(cb) {
			processor.consistentTransactionsPool.splice(0, waitingProcessTransactionSize, cb);
		}], function(err) {
			if(!!err)
			{
				throw Error("class Processor processBlock, " + err)
			}
		});
}

util.inherits(BlockChain, AsyncEventEmitter);