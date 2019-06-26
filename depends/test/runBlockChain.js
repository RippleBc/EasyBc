const Transaction = require("../transaction");
const utils = require("../utils");
const Block = require("../block");
const BlockChain = require("../block_chain");
const Trie = require("../merkle_patricia_tree");
const levelup = require("levelup");
const leveldown = require("leveldown");
const path = require("path");
const {assert, expect, should} = require("chai");

const toBuffer = utils.toBuffer;
const bufferToInt = utils.bufferToInt;

utils.delDir(path.join(__dirname, "./data1"));
utils.delDir(path.join(__dirname, "./data2"));
utils.delDir(path.join(__dirname, "./data3"));

class Db
{
	constructor(dbDir)
	{
		this.db = levelup(leveldown(dbDir));
	}

	async getBlockHashByNumber(number)
	{
		return await this.db.get(number);
	}

	async getBlockByHash(hash)
	{
		const blockRaw = await this.db.get(hash)
		return new Block(blockRaw);
	}

	async getBlockChainHeight()
	{
		return await this.db.get("height");
	}

	async saveBlockChainHeight(height)
	{
		await this.db.put("height", height);
	}

	async saveBlock(block)
	{
		await this.db.put(block.header.number, block.hash());
		await this.db.put(block.hash(), block.serialize());
	}

	async saveTransactions()
	{
		
	}
}

var db = new Db(path.join(__dirname, "./data1"));

const privateKey = toBuffer("0x459705e79404b3604e4eef0aa1becedef1a227865a122826106f7f511682ea86");
const publicKey = toBuffer("0x873426d507b1ce4401a28908ce1af24b61aa0cc4187de39b812d994b656fd095120732955193857afd876066e9c481dea6968afe423ae104224b026ee5fddeca");
const from = toBuffer("0x6ea3ba30a7e81d92ad8aa2e359c5d8f297fc0fb1");
const to = toBuffer("0x5da3ba30a7e81d92ad8aa2e359c5d8f297fc0ff3");

const timeNow = "0x456321987";

describe("run block chain test", function() {
	it("check privateKey and publicKey", function() {
		assert.equal(utils.isValidPrivate(privateKey), true, `privateKey 0x${privateKey.toString("hex")} is invalid`);
		assert.equal(utils.isValidPublic(publicKey), true, `publicKey 0x${publicKey.toString("hex")} is invalid`);
	});

	it("check run tx", function(done) {
		const transaction = new Transaction({
			nonce: 1,
			to: to,
			value: 255,
			data: "0xd3d3"
		});

		const blockChain = new BlockChain({
			db: db
		});

		const runTx = async function()
		{
			let fromAccount = await blockChain.stateManager.getAccount(from);
			let toAccount = await blockChain.stateManager.getAccount(to);

			assert.equal(fromAccount.nonce.toString("hex"), "", `from ${from.toString("hex")} should be 0, now is ${fromAccount.nonce.toString("hex")}`);
			assert.equal(fromAccount.balance.toString("hex"), "", `from ${from.toString("hex")} should be 0, now is ${fromAccount.balance.toString("hex")}`)
			assert.equal(toAccount.nonce.toString("hex"), "", `to ${to.toString("hex")} should be 0, now is ${toAccount.nonce.toString("hex")}`);
			assert.equal(toAccount.balance.toString("hex"), "", `to ${to.toString("hex")} should be 0, now is ${toAccount.balance.toString("hex")}`);

			// update balance
			fromAccount.balance = "0xff";
			blockChain.stateManager.putAccount(from, fromAccount.serialize());

			// check balance
			fromAccount = await blockChain.stateManager.getAccount(from);
			assert.equal(bufferToInt(fromAccount.nonce), 0, `from ${from.toString("hex")} should be 0, now is ${fromAccount.nonce.toString("hex")}`);
			assert.equal(bufferToInt(fromAccount.balance), 255, `from ${from.toString("hex")} should be 255, now is ${fromAccount.balance.toString("hex")}`);

			// transaction sign
			transaction.sign(privateKey);

			// run transaction
			await blockChain.runTx({tx: transaction});

			fromAccount = await blockChain.stateManager.getAccount(from);
			toAccount = await blockChain.stateManager.getAccount(to);

			assert.equal(bufferToInt(fromAccount.nonce), 1, `from ${from.toString("hex")} should be 1, now is ${fromAccount.nonce.toString("hex")}`);
			assert.equal(bufferToInt(fromAccount.balance), 0, `from ${from.toString("hex")} should be 0, now is ${fromAccount.balance.toString("hex")}`);
			assert.equal(bufferToInt(toAccount.nonce), 0, `to ${to.toString("hex")} should be 0, now is ${toAccount.nonce.toString("hex")}`);
			assert.equal(bufferToInt(toAccount.balance), 255, `to ${to.toString("hex")} should be 255, now is ${toAccount.balance.toString("hex")}`);
		}

		runTx().then(() => done()).catch(err => {
			done(err);
		});
	});

	it("check run block 1", function(done) {
		const transaction1 = new Transaction({
			nonce: 1,
			to: to,
			value: 255,
			data: "0xd3d3"
		});

		const transaction2 = new Transaction({
			nonce: 1,
			to: to,
			value: 255,
			data: "0xd3d3"
		});

		transaction1.sign(privateKey);

		const blockChain = new BlockChain({
			db: db
		});

		const parentBlock = new Block({
			header: {
				number: 1,
				timestamp: timeNow,
				transactionsTrie: "0x263f7bb49a1de9a812622ba15adcb0483756feaa37028989f945169eb6a4251b"
			},
			transactions: [transaction1, transaction2]
		});

		const block = new Block({
			header: {
				parentHash: "0x8bc429923a2685fe10b31d40e0ec615640806a0d37fb4d7554560144c4825b15",
				number: 2,
				timestamp: timeNow + 2,
				transactionsTrie: "0x4fb282117806ad436cd26ee13c0504694cc4f63e6d44acf6d82ac43d9aa8dd49"
			},
			transactions: [transaction1, transaction1]
		});

		const checkRunBlock = async function()
		{
			// run block not signed
			let err;
			let runParentBlockState = true;
			try 
			{
				await blockChain.runBlock({
					block: parentBlock
				});
			}
			catch(e)
			{
				err = e
				runParentBlockState = false;
			}	
			if(runParentBlockState)
			{
				if(err.indexOf("property from is invalid") === -1)
				{
					await Promise.reject("run block should be failed");
				}
			}

			// run block not enough fund
			let runBlockResult;
			try
			{
				runBlockResult = await blockChain.runBlock({
					block: block
				});
			}
			catch(e)
			{
				await Promise.reject(`run block should be success, now is failed, ${e}`);
			}

			if(runBlockResult.state)
			{
				await Promise.reject(`run block, some transactions should be failed`);
			}
			if(runBlockResult.transactions.length !== 2)
			{
				await Promise.reject("run block, all transactions should be failed");
			}
			if(runBlockResult.msg.indexOf("fund should bigger than") === -1)
			{
				await Promise.reject("run block, transaction should be failed with funds is not enough");
			}

			// run block
			let fromAccount = await blockChain.stateManager.getAccount(from);
			fromAccount.balance = 255 * 2;
			blockChain.stateManager.putAccount(from, fromAccount.serialize());
			await blockChain.stateManager.flushCache();

			fromAccount = await blockChain.stateManager.getAccount(from);

			assert.equal(bufferToInt(fromAccount.balance), 510, `address ${from.toString("hex")}'s balance should be 255, now is ${bufferToInt(fromAccount.balance)}`);

			try
			{
				runBlockResult = await blockChain.runBlock({
					block: block
				});
			}
			catch(e)
			{
				await Promise.reject(`run block should be success, now is failed, ${e}`);
			}

			if(runBlockResult.state)
			{
				await Promise.reject(`run block, some transactions should be failed`);
			}
			if(runBlockResult.transactions.length !== 1)
			{
				await Promise.reject("run block, second transaction should be failed");
			}
			if(runBlockResult.msg.indexOf("nonce should be") === -1)
			{
				await Promise.reject(`run block, tx1 should be failed with invalid transaction nonce, now is ${runBlockResult.msg}`);
			}
		}

		checkRunBlock().then(() => {
			done();
		}).catch(err => {
			done(err);
		});
	});

	it("check run blockChain 2", function(done) {
		// init txs
		const transaction1 = new Transaction({
			nonce: 1,
			to: to,
			value: 255,
			data: "0xd3d3"
		});

		const transaction2 = new Transaction({
			nonce: 2,
			to: to,
			value: 255,
			data: "0xd3d3"
		});

		transaction1.sign(privateKey);
		transaction2.sign(privateKey);

		// 
		db = new Db(path.join(__dirname, "./data2"));
		const blockChain = new BlockChain({
			trie: new Trie(levelup(leveldown(path.join(__dirname, "./data3")))),
			db: db
		});

		// init block
		const parentBlock = new Block({
			header: {
				number: 1,
				timestamp: timeNow,
				transactionsTrie: "0x1d2ab7c0e11ebdce8f63762da0bdbf562d38058faae99e3b9de91a762bf707b5"
			},
			transactions: [transaction1]
		});

		const block = new Block({
			header: {
				parentHash: "0x8bc429923a2685fe10b31d40e0ec615640806a0d37fb4d7554560144c4825b15",
				number: 2,
				timestamp: timeNow + 2,
				transactionsTrie: "0x263f7bb49a1de9a812622ba15adcb0483756feaa37028989f945169eb6a4251b"
			},
			transactions: [transaction2]
		});

		const checkRunBlockChain = async function()
		{
			// init account balance
			let fromAccount = await blockChain.stateManager.getAccount(from);
			fromAccount.balance = 255 * 2;
			blockChain.stateManager.putAccount(from, fromAccount.serialize());
			await blockChain.stateManager.flushCache();

			// run block
			let runBlockChainResult = await blockChain.runBlockChain({
				block: parentBlock,
				generate: true
			});
			assert.equal(runBlockChainResult.state, 0, `run parent block failed, ${runBlockChainResult.msg}`);

			// init account nonce
			fromAccount = await blockChain.stateManager.getAccount(from);
			fromAccount.nonce = 1;
			blockChain.stateManager.putAccount(from, fromAccount.serialize());
			await blockChain.stateManager.flushCache();

			// run block
			runBlockChainResult = await blockChain.runBlockChain({
				block: block,
				generate: true
			});
			assert.equal(runBlockChainResult.state, 0, `run block failed, ${runBlockChainResult.msg}`);

			// check number 1 block
			const parentBlockTmp = await blockChain.getBlockByNumber(toBuffer(1));
			assert.equal(parentBlockTmp.hash().toString("hex"), "8bc429923a2685fe10b31d40e0ec615640806a0d37fb4d7554560144c4825b15", `parent block hash should be 8bc429923a2685fe10b31d40e0ec615640806a0d37fb4d7554560144c4825b15, now is ${parentBlockTmp.hash().toString("hex")}`);
			assert.equal(bufferToInt(parentBlockTmp.header.number), 1, `parent block number should be 1, now is ${bufferToInt(parentBlockTmp.header.number)}`);
			assert.equal(bufferToInt(parentBlockTmp.header.timestamp), timeNow, `parent block timestamp should be ${timeNow}, now is ${bufferToInt(parentBlockTmp.header.timestamp)}`);
			assert.equal(parentBlockTmp.header.transactionsTrie.toString("hex"), "1d2ab7c0e11ebdce8f63762da0bdbf562d38058faae99e3b9de91a762bf707b5", `parent block transactionsTrie should be 1d2ab7c0e11ebdce8f63762da0bdbf562d38058faae99e3b9de91a762bf707b5, now is ${bufferToInt(parentBlockTmp.header.number)}`);

			// check number 2 block
			const blockTmp = await blockChain.getBlockByNumber(toBuffer(2));
			assert.equal(blockTmp.hash().toString("hex"), "a3b5f6267888c82ca9b0d9c8e0c8f844b6708dcad48acaae4532f57e486374ad", `block hash should be a3b5f6267888c82ca9b0d9c8e0c8f844b6708dcad48acaae4532f57e486374ad, now is ${blockTmp.hash().toString("hex")}`);
			assert.equal(bufferToInt(blockTmp.header.number), 2, `block number should be 2, now is ${bufferToInt(blockTmp.header.number)}`);
			assert.equal(bufferToInt(blockTmp.header.timestamp), timeNow + 2, `block timestamp should be ${timeNow + 2}, now is ${bufferToInt(blockTmp.header.timestamp)}`);
			assert.equal(blockTmp.header.transactionsTrie.toString("hex"), "263f7bb49a1de9a812622ba15adcb0483756feaa37028989f945169eb6a4251b", `block transactionsTrie should be 263f7bb49a1de9a812622ba15adcb0483756feaa37028989f945169eb6a4251b, now is ${bufferToInt(blockTmp.header.number)}`);
		}

		checkRunBlockChain().then(() => {
			done();
		}).catch(err => {
			done(err.stack ? err.stack : err.toString());
		});
	});
})