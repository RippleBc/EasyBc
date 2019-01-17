const util = require("../../utils")
const Block = require("../index.js")
const assert = require("assert")
const async = require("async")
const Transaction = require("../../transaction")
const BlockChain = require("../../block_chain");

const Buffer = util.Buffer;

var rawTx = [
  "0x01",
  "0x1234567891123456789112345678911234567891",
  "0x2710",
  "hello",
  "0x1c",
  "0xf25dcf0fbbd3a8b629ab6f0a758cae100c2432a2fd761d75a81b9b08352156da",
  "0x3504bcfe0b27a31658ba34c292dbf05818c7e560dbd193f7cdb6500ccfbda94a"
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
		assert(block.transactions[0].to.toString("hex") === "1234567891123456789112345678911234567891" , "err");
		assert(block.transactions[0].value.toString("hex") === "2710" , "err");
		assert(block.transactions[0].data.toString() === "hello" , "err");
		assert(block.transactions[0].v.toString("hex") === "1c" , "err");
		assert(block.transactions[0].r.toString("hex") === "f25dcf0fbbd3a8b629ab6f0a758cae100c2432a2fd761d75a81b9b08352156da" , "err");
		assert(block.transactions[0].s.toString("hex") === "3504bcfe0b27a31658ba34c292dbf05818c7e560dbd193f7cdb6500ccfbda94a" , "err");

		block = new Block([rawHeader, [tx]]);
		block.genTxTrie(cb);
	},
	function(cb) {
		block.header.transactionsTrie = block.txTrie.root;
		assert(block.transactions.length === 1, "err");
		assert(block.transactions[0].nonce.toString("hex") === "01" , "err");
		assert(block.transactions[0].to.toString("hex") === "1234567891123456789112345678911234567891" , "err");
		assert(block.transactions[0].value.toString("hex") === "2710" , "err");
		assert(block.transactions[0].data.toString() === "hello" , "err");
		assert(block.transactions[0].v.toString("hex") === "1c" , "err");
		assert(block.transactions[0].r.toString("hex") === "f25dcf0fbbd3a8b629ab6f0a758cae100c2432a2fd761d75a81b9b08352156da" , "err");
		assert(block.transactions[0].s.toString("hex") === "3504bcfe0b27a31658ba34c292dbf05818c7e560dbd193f7cdb6500ccfbda94a" , "err");

		block = new Block(block.serialize());
		block.genTxTrie(cb);
	},
	function(cb) {
		block.header.transactionsTrie = block.txTrie.root;
		assert(block.transactions.length === 1, "err");
		assert(block.transactions[0].nonce.toString("hex") === "01" , "err");
		assert(block.transactions[0].to.toString("hex") === "1234567891123456789112345678911234567891" , "err");
		assert(block.transactions[0].value.toString("hex") === "2710" , "err");
		assert(block.transactions[0].data.toString() === "hello" , "err");
		assert(block.transactions[0].v.toString("hex") === "1c" , "err");
		assert(block.transactions[0].r.toString("hex") === "f25dcf0fbbd3a8b629ab6f0a758cae100c2432a2fd761d75a81b9b08352156da" , "err");
		assert(block.transactions[0].s.toString("hex") === "3504bcfe0b27a31658ba34c292dbf05818c7e560dbd193f7cdb6500ccfbda94a" , "err");
		assert(block.validateTransactionsTrie() === true, "err");
		assert(block.validateTransactions() === true, "err");
		block.validate(new BlockChain(), cb);
	}], function(err) {
		assert(!!err === false, "err");
		console.log("test!!!")
	});
