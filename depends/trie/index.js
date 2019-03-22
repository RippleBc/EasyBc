const MerklePatriciaTree = require("merkle-patricia-tree");

class Trie extends MerklePatriciaTree
{
	constructor(data)
	{
		super(data);
	}

	put(key, value)
	{
		const promise = new Promise((resolve, reject) => {
			super.put(key, value, err => {
				if(!!err)
				{
					return reject(err);
				}

				resolve();
			});
		});

		return promise;
	}

	del(key)
	{
		const promise = new Promise((resolve, reject) => {
			super.del(key, err => {
				if(!!err)
				{
					return reject(err);
				}

				resolve();
			})
		});

		return promise;
	}

	get(key)
	{
		const promise = new Promise((resolve, reject) => {
			super.get(key, (err, value) => {
				if(!!err)
				{
					return reject(err);
				}

				resolve(value);
			})
		});

		return promise;
	}
}

module.exports = Trie;