const Transaction = require("../../Transaction")
const Block = require("../../block")
const BlockChain = require("../../block_chain")
const Consensus = require("../consensus")
const util = require("util")
const AsyncEventEmitter = require("async-eventemitter")
const FlowStoplight = require("flow-stoplight")
const async = require("async")
const Pool = rquire("./pool")

const TRANSACTIONS_SIZE_LIMIT = 10;

class Processor extends AsyncEventEmitter
{
	constructor()
	{
		super();

		const self = this;

		this.consensus = new Consensus(self);
		this.transactionsPool = new Pool();
		this.consistentTransactionsPool = new Pool();

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

		self.transactionsPool.push(tranasction, cb);
		this.emit("transaction");
	}
}


function initBlockChain(processor)
{
	async.waterfall([
		function(cb) {
			
		}])
	processor.blockChain = new BlockChain();
}

/**
 * @param {Block} block 
 */
function processBlock(processor)
{
	if(processor.transactionsPool.length < TRANSACTIONS_SIZE_LIMIT)
	{
		return;
	}

	const transactionSize = processor.transactionsPool.length < TRANSACTIONS_SIZE_LIMIT ? processor.transactionsPool.length : TRANSACTIONS_SIZE_LIMIT;

	let rawHeader = {
		parentHash: Buffer.alloc(32),
		stateRoot: Buffer.alloc(32),
		transactionsTrie: Buffer.alloc(32),
		number: 0,
		timestamp: Date.now(),
		extraData: Buffer.alloc(0),
		transactionSizeLimit: transactionSize
	};

	let block;

	let bnMaxBlockNumber;

	async.waterfall([
		function(cb) {
			processor.blockChain.getMaxBlockNumber(cb);
		},
		function(maxBlockNumber, cb) {
			// init block number
			rawHeader.number = maxBlockNumber;

			processor.blockChain.getBlockHashByNumber(bnMaxBlockNumber, cb)
		},
		function(parentHash, cb) {
			// init parantHash
			rawHeader.parentHash = parentHash;
			
			// init block
			let rawBLock = [{header: rawHeader, transactions: []}];

			for(let i = 0; i < transactionSize; i++)
			{
				rawBLock.transactions.push(processor.consistentTransactionsPool[i]);
			}

			block = new Block(rawBLock);
			block.genTxTrie(cb);
		},
		function(cb) {
			// init transactionsTrie
			block.header.transactionsTrie = block.trie.root;

			// run block
			processor.blockChain.runBlock({block: block, generate: true}, function(err, errCode, failedTransactions) {
				if(!!err && errCode === blockChain.TX_PROCESS_ERR)
				{
					for(let i = 0; i < failedTransactions.length; i++)
					{
						console.log("failedTransactions: index: " + i + ", hash: " + failedTransactions[i].hash(true).toString("hex"));
					}
				}
				cb(err);
			});
		},
		function(cb) {
			processor.consistentTransactionsPool.splice(0, transactionSize, cb);
		}], function() {

		});
}

util.inherits(BlockChain, AsyncEventEmitter);