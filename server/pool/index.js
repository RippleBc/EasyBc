const Transaction = require("../../Transaction")
const Block = require("../../block")
const BlockChain = require("../../block_chain")
const Consensus = require("../consensus")
const util = require("util")

class Pool
{
	constructor()
	{
		this.consensus = new Consensus(self);
		this.sem = require("semaphore")(1);
		this.transactionsPool = [];
		this.consistentTransactionsPool = [];
	}

	/**
	 * @param {Buffer|String|Array|Object}
	 */
	processTransaction(transaction, cb)
	{
		const self = this;

		self.sem.take(function() {
			let tranasction = new Transaction(tranasction);

			// check transaction
			let errString = tranasction.validate(true);
			if(errString !== "")
			{
				cb(errString);
			}

			self.transactionsPool = self.transactionsPool.push(tranasction);

			cb(null);
		}
	}

	processConsistentTransaction()
	{

	}
}

util.inherits(BlockChain, AsyncEventEmitter);