const Transaction = require("../../Transaction")
const Block = require("../../block")
const BlockChain = require("../../block_chain")
const Consensus = require("../consensus")
const util = require("util")
const AsyncEventEmitter = require("async-eventemitter")
const FlowStoplight = require("flow-stoplight")
const semaphore = require("semaphore");

class Pool extends AsyncEventEmitter
{
	constructor()
	{
		super();

		this.blockChain = new BlockChain();
		this.consensus = new Consensus(self);
		this.transactionsQueueSem = semaphore(1);
		this.consistentTransactionsSem = semaphore(1);
		this.stoplight = new FlowStoplight();
		this.transactionsPool = [];
		this.consistentTransactionsPool = [];


		this.on("consistentTransaction", function(err, next, data) {
			self.consistentTransactionsSem.take(function() {
				self.consistentTransactionsSem.push(tranasction);
				if(self.consistentTransactionsSem.length > 10)
				{
					// add new block to
				}
			}
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

		self.transactionsQueueSem.take(function() {
			self.transactionsPool.push(tranasction);
			cb(null);
		}
	}
}

util.inherits(BlockChain, AsyncEventEmitter);