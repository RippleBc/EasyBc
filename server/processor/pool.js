const semaphore = require("semaphore")

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

	splice(begin, end, cb)
	{
		const self = this;

		self.sem.take(function() {
			//
			if(end)
			{
				self.data.splice(begin, end);
			}
			else
			{
				self.data.splice(begin);
			}

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

	get(index)
	{
		const self = this;

		return self.data[index];
	}

	del(transaction, cb)
	{
		const self = this;

		self.sem.take(function() {
			for(let i = 0; i < self.data.length; i++)
			{
				if(transaction.hash().toString("hex") === self.data[i].hash().toString("hex"))
				{
					self.data[i].splice(i, i + 1);
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
					if(transactions[i].hash().toString("hex") === self.data[j].hash().toString("hex"))
					{
						self.data[j].splice(j, j + 1);
					}
				}
			}

			self.sem.leave();
			cb();
		});
	}
}

module.exports = Pool;