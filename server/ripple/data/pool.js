const util = require("../../../utils")

/**
 * Creates a new Pool object
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

		this.data = [];
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

  /**
   * batch get data
   */
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
		if(values instanceof Array === false)
		{
			throw new Error(`class Pool batchPush, argument values should be Array, now is ${typeof values}`)
		}

		for(let i = 0; i < values.length; i++)
		{
			this.push(values[i], ifFilterSame);
		}
	}
	/**
	 * @param {Object} value
	 */
	push(value, ifFilterSame = false)
	{
		if(typeof value !== "object")
		{
			throw new Error(`class Pool push, argument value should be Object, now is ${typeof value}`)
		}

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
	 * @param {Array/Object} values
	 */
	batchDel(values)
	{
		if(values instanceof Array === false)
		{
			throw new Error(`class Pool batchDel, argument values should be Array, now is ${typeof values}`)
		}

		for(let i = 0; i < values.length; i++)
		{
			this.del(values[i])
		}
	}
	/**
	 * @param {Object} value
	 */
	del(value)
	{
		if(typeof value !== "object")
		{
			throw new Error(`class Pool del, argument value should be Object, now is ${typeof value}`)
		}

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

	/*
	 * @param {String} valueHash
	 */
	ifExist(valueHash)
	{
		if(typeof valueHash !== "string")
		{
			throw new Error(`class Pool ifExist, argument valueHash should be String, now is ${typeof valueHash}`)
		}

		for(let i = 0; i < this.data.length; i++)
		{
			if(this.data[i].hash(true).toString("hex") === valueHash)
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
		if(typeof index !== "number")
		{
			throw new Error(`class Pool get, argument index should be Number, now is ${typeof index}`);
		}

		return this.data[i];
	}
}

module.exports = Pool;