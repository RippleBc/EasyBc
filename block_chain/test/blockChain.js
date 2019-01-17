const Block = require("../../block")
const BlockChain =  require("../index.js")
const async = require("async")
const util = require("../../utils")
const assert = require("assert")
const Transaction = require("../../transaction")
const Trie = require("merkle-patricia-tree/secure.js")
const initDb = require("../../db")

const BN = util.BN;

function test1(cb)
{
	var rawTx = [
	  "0x01",
	  "0x1234567891123456789112345678911234567891",
	  "0x2710",
	  "hello",
	  "0x1c",
	  "0xf25dcf0fbbd3a8b629ab6f0a758cae100c2432a2fd761d75a81b9b08352156da",
	  "0x3504bcfe0b27a31658ba34c292dbf05818c7e560dbd193f7cdb6500ccfbda94a"
	];

	let rawHeader = {
		parentHash: Buffer.alloc(32),
		stateRoot: Buffer.alloc(32),
		transactionsTrie: Buffer.alloc(32),
		timestamp: 56892468,
		extraData: "0x123",
		nonce: 100,
		transactionSizeLimit: 2
	};

	let block = new Block([rawHeader, [rawTx]]);
	let blockChain = new BlockChain({
		stateTrie: null
	});


	let tx1;

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

			tx1 = block.transactions[0];
			assert(tx1.nonce.toString("hex") == "01", "err");
			assert(tx1.to.toString("hex") == "1234567891123456789112345678911234567891", "err");
			assert(tx1.value.toString("hex") == "2710", "err");
			assert(tx1.data.toString() == "hello", "err");
			assert(tx1.v.toString("hex") == "1c", "err");
			assert(tx1.r.toString("hex") == "f25dcf0fbbd3a8b629ab6f0a758cae100c2432a2fd761d75a81b9b08352156da", "err");
			assert(tx1.s.toString("hex") == "3504bcfe0b27a31658ba34c292dbf05818c7e560dbd193f7cdb6500ccfbda94a", "err");

			blockChain.stateManager.getAccountBalance(tx1.from, cb);
		},
		function(balance, cb) {
			assert(new BN(balance).eq(new BN("38f0", 16)), "err");
			blockChain.stateManager.getAccountBalance(tx1.to, cb);
		},
		function(balance, cb) {
			assert(new BN(balance).eq(new BN("8710", 16)), "err");
			cb();
		}], function(err) {
			if(!!err)
			{
				cb(err);
				return;
			}
			console.log(block.header.hash().toString("hex"))
			console.log(blockChain.stateManager.trie.root.toString("hex"))
			console.log("test ok!!!")
			cb();
		});
}

function test2(cb)
{
	var rawTx = [
	  "0x01",
	  "0x1234567891123456789112345678911234567891",
	  "0x2710",
	  "hello",
	  "0x1c",
	  "0xf25dcf0fbbd3a8b629ab6f0a758cae100c2432a2fd761d75a81b9b08352156da",
	  "0x3504bcfe0b27a31658ba34c292dbf05818c7e560dbd193f7cdb6500ccfbda94a"
	];

	let rawHeader = {
		parentHash: "0x9ea454e199854287cdfc811520757c3f91f86005f427ee00c2b159bc5a75b5a5",
		number: 2,
		stateRoot: Buffer.alloc(32),
		transactionsTrie: Buffer.alloc(32),
		timestamp: 56892499,
		extraData: "0x123",
		nonce: 100,
		transactionSizeLimit: 2
	};

	let block = new Block([rawHeader, [rawTx]]);

	let db = initDb();
	let trie = new Trie(db, "0x762e0cb00b55a409cc821904baf8ba8904298a47d204802d9414561e54026ab6");

	let blockChain = new BlockChain();

	let tx1 = block.transactions[0];
	assert(tx1.nonce.toString("hex") == "01", "err");
	assert(tx1.to.toString("hex") == "1234567891123456789112345678911234567891", "err");
	assert(tx1.value.toString("hex") == "2710", "err");
	assert(tx1.data.toString() == "hello", "err");
	assert(tx1.v.toString("hex") == "1c", "err");
	assert(tx1.r.toString("hex") == "f25dcf0fbbd3a8b629ab6f0a758cae100c2432a2fd761d75a81b9b08352156da", "err");
	assert(tx1.s.toString("hex") == "3504bcfe0b27a31658ba34c292dbf05818c7e560dbd193f7cdb6500ccfbda94a", "err");

	async.waterfall([
		function(cb) {
			block.genTxTrie(cb);
		},
		function(cb) {
			block.header.transactionsTrie = block.txTrie.root;
			block.validate(blockChain, cb);
		},
		function(cb) {
			blockChain.runBlock({block: block, generate: true, state: "0x762e0cb00b55a409cc821904baf8ba8904298a47d204802d9414561e54026ab6"}, function(err, errCode, failedTransactions) {
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
			blockChain.getBlockByNumber(2, cb);
		},
		function(block, cb) {
			assert(util.bufferToInt(block.header.number) === 2, "err");
			assert(util.bufferToInt(block.header.timestamp) === 56892499, "err");
			assert(util.bufferToInt(block.header.nonce) === 100, "err");
			assert(block.header.extraData.toString("hex") === "0123", "err");
			assert(util.bufferToInt(block.header.transactionSizeLimit) === 2, "err");

			tx1 = block.transactions[0];
			assert(tx1.nonce.toString("hex") == "01", "err");
			assert(tx1.to.toString("hex") == "1234567891123456789112345678911234567891", "err");
			assert(tx1.value.toString("hex") == "2710", "err");
			assert(tx1.data.toString() == "hello", "err");
			assert(tx1.v.toString("hex") == "1c", "err");
			assert(tx1.r.toString("hex") == "f25dcf0fbbd3a8b629ab6f0a758cae100c2432a2fd761d75a81b9b08352156da", "err");
			assert(tx1.s.toString("hex") == "3504bcfe0b27a31658ba34c292dbf05818c7e560dbd193f7cdb6500ccfbda94a", "err");
			
			blockChain.stateManager.getAccountBalance(tx1.from, cb);
		},
		function(balance, cb) {
			console.log(balance.toString("hex"))
			assert(new BN(balance).eq(new BN("11e0", 16)), "err");
			blockChain.stateManager.getAccountBalance(tx1.to, cb);
		},
		function(balance, cb) {
			assert(new BN(balance).eq(new BN("ae20", 16)), "err");
			cb(null);
		}], function(err) {
			if(!!err)
			{
				return cb(err);
			}
			console.log("test ok!!!");
			cb();
		});
}

async.waterfall([
	test1,
	test2
	], function(err) {

	})