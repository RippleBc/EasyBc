const BaseTrie = require("./index")
const async = require("async")
const utils = require("../utils")

const Buffer = utils.Buffer;

const baseTrie = new BaseTrie()

const datas = [
	[ "key1aa", "0123456789012345678901234567890123456789xxx"],
	[ "key1", "0123456789012345678901234567890123456789Very_Long"],
	[ "key2bb", "aval3"],
	[ "key2", "short"],
	[ "key3cc", "aval3"],
	[ "key3","1234567890123456789012345678901"]
];

async.eachSeries(datas, (data, done) => {
	baseTrie.put(Buffer.from(data[0]), Buffer.from(data[1]), done);
}, () => {
	baseTrie._findDbNodes((nodeRef, node, key, next) => {
		console.log(`\n\nprocessed key: ${key}, node hash: ${node.hash().toString('hex')}, node detail: ${node.toString()}\n\n`)
		next();
	}, () => {

	})
})