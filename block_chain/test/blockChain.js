const Block = require("../../block");
const BlockChain =  require("../index.js");
const async = require("async");
const util = require("../../utils");
const assert = require("assert");

let rawHeader = {
	parentHash: Buffer.alloc(32),
	stateRoot: Buffer.alloc(32),
	transactionsTrie: Buffer.alloc(32),
	timestamp: 56892468,
	extraData: "0x123",
	nonce: 100,
	transactionSizeLimit: 2
};

var rawTx = [
  "0x01",
  "0x1234567891123456789112345678911234567891",
  "0x2710",
  "hello",
  "0x1c",
  "0xf25dcf0fbbd3a8b629ab6f0a758cae100c2432a2fd761d75a81b9b08352156da",
  "0x3504bcfe0b27a31658ba34c292dbf05818c7e560dbd193f7cdb6500ccfbda94a"
];

let block = new Block([rawHeader, [rawTx, rawTx]]);
let blockChain = new BlockChain({
	stateTrie: null
});

assert(util.bufferToInt(block.header.number) === 0, "err");
assert(util.bufferToInt(block.header.timestamp) === 56892468, "err");
assert(util.bufferToInt(block.header.nonce) === 100, "err");
assert(block.header.extraData.toString("hex") === "0123", "err");
assert(util.bufferToInt(block.header.transactionSizeLimit) === 2, "err");

async.waterfall([
	function(cb) {
		block.genTxTrie(cb);
	},
	function(cb) {
		block.header.transactionsTrie = block.txTrie.root;
		block.validate(blockChain, cb);
	},
	function(cb) {
		blockChain.runBlock({block: block, generate: true}, function(err, errCode, failedTransactions) {
			if(!!err && errCode === blockChain.TX_PROCESS_ERR)
			{
				for(let i = 0; i < failedTransactions.length; i++)
				{
					console.log("failedTransactions: index: " + i + ", hash: " + failedTransactions[i].hash(true).toString("hex"));
				}
			}
			cb(err);
		});
	},
	function(cb) {
		blockChain.putBlock(block, cb);
	},
	function(cb) {
		blockChain.getBlockByNumber(1, cb);
	},
	function(block, cb) {
		assert(util.bufferToInt(block.header.number) === 1, "err");
		assert(util.bufferToInt(block.header.timestamp) === 56892468, "err");
		assert(util.bufferToInt(block.header.nonce) === 100, "err");
		assert(block.header.extraData.toString("hex") === "0123", "err");
		assert(util.bufferToInt(block.header.transactionSizeLimit) === 2, "err");
		cb();
	}], function(err) {
		if(!!err)
		{
			console.log(err);
			return;
		}
		console.log("ok!!!")
	});
