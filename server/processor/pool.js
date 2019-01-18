const semaphore = require("semaphore")

class Pool
{
	constructor()
	{
		const self = this;

		this.sem = semaphore(1);
		self.data = [];
		self.defineProperty("length", {
			get: function() {
				return self.data.length;
			}
		})
	}

	splice(begin, end, cb)
	{
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

	batchPush(value, cb)
	{
		self.sem.take(function() {
			//
			for(let i = 0; i < value.length; i++)
			{
				self.data.push(value[i]);
			}

			self.sem.leave();
			cb();
		});
	}

	push(value, cb)
	{
		self.sem.take(function() {
			// 
			self.data.push(value);

			self.sem.leave();
			cb();
		});
	}
}