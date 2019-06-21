const BaseTrie = require('../baseTrie');
const async = require("async");
const baseTrie = new BaseTrie();

async.waterfall([
	cb => {
		baseTrie.put(Buffer.from('do'), Buffer.from('verb'), cb)
	},
	cb => {
		const readStream = baseTrie.createReadStream();
		readStream.on('data', data => {
			console.log(`key: ${data.key}, value: ${data.value.toString()}`)
		})
		readStream.on('end', () => {
			console.log("\n\n\n")
			cb();
		})
	},
	cb => {
		baseTrie.put(Buffer.from('dog'), Buffer.from('puppy'), cb)
	},
	cb => {
		const readStream = baseTrie.createReadStream();
		readStream.on('data', data => {
			console.log(`key: ${data.key}, value: ${data.value.toString()}`)
		})
		readStream.on('end', () => {
			console.log("\n\n\n")
			cb();
		})
	},
	cb => {
		baseTrie.put(Buffer.from('doge'), Buffer.from('coin'), cb)
	},
	cb => {
		const readStream = baseTrie.createReadStream();
		readStream.on('data', data => {
			console.log(`key: ${data.key}, value: ${data.value.toString()}`)
		})
		readStream.on('end', () => {
			console.log("\n\n\n")
			cb();
		})
	},
	cb => {
		baseTrie.put(Buffer.from('horse'), Buffer.from('stallion'), cb)
	},
	cb => {
		const readStream = baseTrie.createReadStream();
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