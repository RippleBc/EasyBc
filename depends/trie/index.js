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
}

module.exports = Trie;