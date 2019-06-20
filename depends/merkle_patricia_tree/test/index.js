const BaseTrie = require('../baseTrie');
const async = require("async");
const baseTrie = new BaseTrie();
const readStream = baseTrie.createReadStream();

async.waterfall([
	cb => {
		baseTrie.put(Buffer.from('do'), Buffer.from('verb'), cb)
	},
	cb => {
		baseTrie.put(Buffer.from('dog'), Buffer.from('puppy'), cb)
	},
	cb => {
		baseTrie.put(Buffer.from('doge'), Buffer.from('coin'), cb)
	},
	cb => {
		baseTrie.put(Buffer.from('horse'), Buffer.from('stallion'), cb)
	},
	cb => {
		readStream.on('data', data => {
			console.log(`key: ${data.key}, value: ${data.value.toString()}`)
		})
		readStream.on('end', () => {
			cb();
		})
	}], err => {
		if(!!err)
		{
			console.error(err.stack);
		}
	})