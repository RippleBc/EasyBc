const util = require("../../../utils")

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

	reset()
  {
    this.data = [];
  }

	slice(begin, end)
	{
		return this.data.slice(begin, end);
	}
	splice(begin, number)
	{	
		return this.data.splice(begin, number);
	}

	/**
	 * @param {Array/Object} values
	 */
	batchPush(values, ifFilterSame = false)
	{
		for(let i = 0; i < values.length; i++)
		{
			this.push(values[i], ifFilterSame)
		}
	}
	/**
	 * @param {Object} value
	 */
	push(value, ifFilterSame = false)
	{
		if(ifFilterSame)
		{
			for(let i = 0; i < this.length; i++)
			{
				if(this.data[i].hash(true).toString("hex") === value.toString("hex"))
				{
					return;
				}
			}
		}

		this.data.push(value);	
	}

	/**
	 * @param {Object|Buffer} value
	 */
	del(value)
	{
		for(let i = 0; i < this.data.length; i++)
		{
			let hash = value;
			if(typeof value === "object")
			{
				hash = value.hash(true).toString("hex");
			}

			if(value.hash().toString("hex") === this.data[i].hash().toString("hex"))
			{
				this.data[i].splice(i, 1);
			}
		}
	}
	/**
	 * @param {Array/Object|Buffer} values
	 */
	batchDel(values)
	{
		for(let i = 0; i < values.length; i++)
		{
			for(let j = 0; j < this.data.length; j++)
			{
				let hash = values[i];
				if(typeof values[i] === "object")
				{
					hash = values[i].hash(true).toString("hex");
				}

				if(hash === this.data[j].hash(true).toString("hex"))
				{
					this.data.splice(j, 1);
				}
			}
		}
	}

	/*
	 * @param {*} valueHash
	 */
	ifExist(valueHash)
	{
		valueHash = util.toBuffer(valueHash);

		for(let i = 0; i < this.data.length; i++)
		{
			if(this.data[i].hash(true).toString("hex") === valueHash.toString("hex"))
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