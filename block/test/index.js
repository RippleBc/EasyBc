const util = require("../../utils")
const Block = require("../index.js")
const assert = require("assert")
const async = require("async")
const Transaction = require("../../transaction")
const BlockChain = require("../../block_chain");

const Buffer = util.Buffer;

let rawTx = [
  "0x01",
  "0x09184e72a000",
  "0x2710",
  "hello",
  "0x1c",
  "0x04bc34b177b6c0c86166f85aa3e0e5897565383685c39b76b9deb3b93e8c6a41",
  "0x4d0b2c4ae473ac5f862c7291d57bbe7725dcad6d40f0d181030d6236f11f14e5"
];

let tx = new Transaction(rawTx);

let rawHeader = {
	parentHash: Buffer.alloc(32),
	stateRoot: Buffer.alloc(32),
	transactionsTrie: Buffer.alloc(32),
	number: 1,
	timestamp: 56892468,
	extraData: "0x123",
	nonce: 100,
	transactionSizeLimit: 2
};

let block;

async.waterfall([
	function(cb) {
		block = new Block({header: rawHeader, transactions: [tx]});
		block.genTxTrie(cb);
	},
	function(cb) {
		block.header.transactionsTrie = block.txTrie.root;
		assert(block.transactions.length === 1, "err");
		assert(block.transactions[0].nonce.toString("hex") === "01" , "err");
		assert(block.transactions[0].to.toString("hex") === "09184e72a000" , "err");
		assert(block.transactions[0].value.toString("hex") === "2710" , "err");
		assert(block.transactions[0].data.toString() === "hello" , "err");
		assert(block.transactions[0].v.toString("hex") === "1c" , "err");
		assert(block.transactions[0].r.toString("hex") === "04bc34b177b6c0c86166f85aa3e0e5897565383685c39b76b9deb3b93e8c6a41" , "err");
		assert(block.transactions[0].s.toString("hex") === "4d0b2c4ae473ac5f862c7291d57bbe7725dcad6d40f0d181030d6236f11f14e5" , "err");

		block = new Block([rawHeader, [tx]]);
		block.genTxTrie(cb);
	},
	function(cb) {
		block.header.transactionsTrie = block.txTrie.root;
		assert(block.transactions.length === 1, "err");
		assert(block.transactions[0].nonce.toString("hex") === "01" , "err");
		assert(block.transactions[0].to.toString("hex") === "09184e72a000" , "err");
		assert(block.transactions[0].value.toString("hex") === "2710" , "err");
		assert(block.transactions[0].data.toString() === "hello" , "err");
		assert(block.transactions[0].v.toString("hex") === "1c" , "err");
		assert(block.transactions[0].r.toString("hex") === "04bc34b177b6c0c86166f85aa3e0e5897565383685c39b76b9deb3b93e8c6a41" , "err");
		assert(block.transactions[0].s.toString("hex") === "4d0b2c4ae473ac5f862c7291d57bbe7725dcad6d40f0d181030d6236f11f14e5" , "err");

		block = new Block(block.serialize());
		block.genTxTrie(cb);
	},
	function(cb) {
		block.header.transactionsTrie = block.txTrie.root;
		assert(block.transactions.length === 1, "err");
		assert(block.transactions[0].nonce.toString("hex") === "01" , "err");
		assert(block.transactions[0].to.toString("hex") === "09184e72a000" , "err");
		assert(block.transactions[0].value.toString("hex") === "2710" , "err");
		assert(block.transactions[0].data.toString() === "hello" , "err");
		assert(block.transactions[0].v.toString("hex") === "1c" , "err");
		assert(block.transactions[0].r.toString("hex") === "04bc34b177b6c0c86166f85aa3e0e5897565383685c39b76b9deb3b93e8c6a41" , "err");
		assert(block.transactions[0].s.toString("hex") === "4d0b2c4ae473ac5f862c7291d57bbe7725dcad6d40f0d181030d6236f11f14e5" , "err");
		assert(block.validateTransactionsTrie() === true, "err");
		assert(block.validateTransactions() === true, "err");
		block.validate(new BlockChain(), cb);
	}], function(err) {
		assert(!!err === false, "err");
		console.log("test!!!")
	});
