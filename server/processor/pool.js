const semaphore = require("semaphore")
const util = require("../../utils")

/**
 * Creates a new pool object
 *
 * @class
 * @constructor
 * @prop 
 */
class Pool
{
	constructor()
	{
		const self = this;

		self.sem = semaphore(1);
		self.data = [];
		Object.defineProperty(self, "length", {
			enumerable: true,
      configurable: true,
			get: function() {
				return self.data.length;
			}
		});
	}

	slice(begin, end)
	{
		return this.data.slice(begin, end);
	}

	splice(begin, number, cb)
	{
		const self = this;

		self.sem.take(function() {
		
			self.data.splice(begin, number);

			self.sem.leave();
			cb();
		});
	}

	batchPush(transactions, cb)
	{
		const self = this;

		self.sem.take(function() {
			//
			for(let i = 0; i < transactions.length; i++)
			{
				self.data.push(transactions[i]);
			}

			self.sem.leave();
			cb();
		});
	}

	push(transaction, cb)
	{
		const self = this;

		self.sem.take(function() {
			// 
			self.data.push(transaction);

			self.sem.leave();
			cb();
		});
	}

	del(transaction, cb)
	{
		const self = this;

		self.sem.take(function() {
			for(let i = 0; i < self.data.length; i++)
			{
				if(transaction.hash().toString("hex") === self.data[i].hash().toString("hex"))
				{
					self.data[i].splice(i, 1);
				}
			}

			self.sem.leave();
			cb();
		});
	}

	delBatch(transactions, cb)
	{
		const self = this;

		self.sem.take(function() {
			
			for(let i = 0; i < transactions.length; i++)
			{
				for(let j = 0; j < self.data.length; j++)
				{
					if(transactions[i].hash(true).toString("hex") === self.data[j].hash(true).toString("hex"))
					{
						self.data.splice(j, 1);
					}
				}
			}

			self.sem.leave();
			cb();
		});
	}

	/*
	 * @param {*} transactionHash
	 */
	ifExist(transactionHash)
	{
		transactionHash = util.toBuffer(transactionHash);

		for(let i = 0; i < this.data.length; i++)
		{
			if(this.data[i].hash(true).toString("hex") === transactionHash.toString("hex"))
			{
				return this.data[i];
			}
		}
	}
}

module.exports = Pool;