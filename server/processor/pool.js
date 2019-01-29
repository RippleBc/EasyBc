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

	splice(begin, number)
	{	
		return this.data.splice(begin, number);
	}

	batchPush(transactions)
	{
		for(let i = 0; i < transactions.length; i++)
		{
			this.data.push(transactions[i]);
		}
	}

	push(transaction)
	{
		this.data.push(transaction);	
	}

	del(transaction)
	{
		for(let i = 0; i < this.data.length; i++)
		{
			if(transaction.hash().toString("hex") === this.data[i].hash().toString("hex"))
			{
				this.data[i].splice(i, 1);
			}
		}
	}

	/**
	 * @param [Array|Buffer] transactions
	 */
	batchDel(transactions)
	{
		for(let i = 0; i < transactions.length; i++)
		{
			for(let j = 0; j < this.data.length; j++)
			{
				let hash = transactions[i];
				if(typeof transactions[i] === "Object")
				{
					hash = transactions[i].hash(true).toString("hex");
				}

				if(hash === this.data[j].hash(true).toString("hex"))
				{
					this.data.splice(j, 1);
				}
			}
		}
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

	/**
	 * @param {Number} index
	 */
	get(index)
	{
		return this.data[i];
	}
}

module.exports = Pool;