const Transaction = require("../transaction");
const utils = require("../utils");
const Block = require("../block");
const BlockChain = require("../block_chain");
const Trie = require("../trie");
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

	async saveAccounts(number, stateRoot, accounts)
	{
		
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

	it("check run block", function(done) {
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
				transactionsTrie: "0x57fdab0bfdd14f7e8f9f7bb8a328fa9527550fca063b2abb84cf86a81569bc65"
			},
			transactions: [transaction1, transaction2]
		});

		const block = new Block({
			header: {
				parentHash: "0x5daaa848a9239e8b36fae3c24f4820b293bf7b3cc028b7adca6c3d2a7c3ea701",
				number: 2,
				timestamp: timeNow + 2,
				transactionsTrie: "0x57fdab0bfdd14f7e8f9f7bb8a328fa9527550fca063b2abb84cf86a81569bc65"
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
					await Promise.reject("run parent block should be failed");
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

	it("check run blockChain", function(done) {
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
				transactionsTrie: "0xec9554dcc2796f2c493b5f1782bf2eab646a458db1eaceb0d4a15deb67b8a267"
			},
			transactions: [transaction1]
		});

		const block = new Block({
			header: {
				parentHash: "0xa2b6c509506e8e53d457fdfe309ca48edf55e032d463128ffd819b8498c27d9e",
				number: 2,
				timestamp: timeNow + 2,
				transactionsTrie: "0xa63280a882356c733cf44030e7759e54d3f42aaf74e7a5ece70849845dd44dae"
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
			assert.equal(runBlockChainResult.state, true, `run parent block failed, ${runBlockChainResult.msg}`);

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
			assert.equal(runBlockChainResult.state, true, `run block failed, ${runBlockChainResult.msg}`);

			// check number 1 block
			const parentBlockTmp = await blockChain.getBlockByNumber(toBuffer(1));
			assert.equal(parentBlockTmp.hash().toString("hex"), "a2b6c509506e8e53d457fdfe309ca48edf55e032d463128ffd819b8498c27d9e", `parent block hash should be a2b6c509506e8e53d457fdfe309ca48edf55e032d463128ffd819b8498c27d9e, now is ${parentBlockTmp.hash().toString("hex")}`);
			assert.equal(bufferToInt(parentBlockTmp.header.number), 1, `parent block number should be 1, now is ${bufferToInt(parentBlockTmp.header.number)}`);
			assert.equal(bufferToInt(parentBlockTmp.header.timestamp), timeNow, `parent block timestamp should be ${timeNow}, now is ${bufferToInt(parentBlockTmp.header.timestamp)}`);
			assert.equal(parentBlockTmp.header.transactionsTrie.toString("hex"), "ec9554dcc2796f2c493b5f1782bf2eab646a458db1eaceb0d4a15deb67b8a267", `parent block transactionsTrie should be ec9554dcc2796f2c493b5f1782bf2eab646a458db1eaceb0d4a15deb67b8a267, now is ${bufferToInt(parentBlockTmp.header.number)}`);

			// check number 2 block
			const blockTmp = await blockChain.getBlockByNumber(toBuffer(2));
			assert.equal(blockTmp.hash().toString("hex"), "2f07c1a80ad3c9dbd761da679126f10a95ea99710ac52002a36aff657b66bf89", `block hash should be 2f07c1a80ad3c9dbd761da679126f10a95ea99710ac52002a36aff657b66bf89, now is ${blockTmp.hash().toString("hex")}`);
			assert.equal(bufferToInt(blockTmp.header.number), 2, `block number should be 2, now is ${bufferToInt(blockTmp.header.number)}`);
			assert.equal(bufferToInt(blockTmp.header.timestamp), timeNow + 2, `block timestamp should be ${timeNow + 2}, now is ${bufferToInt(blockTmp.header.timestamp)}`);
			assert.equal(blockTmp.header.transactionsTrie.toString("hex"), "a63280a882356c733cf44030e7759e54d3f42aaf74e7a5ece70849845dd44dae", `block transactionsTrie should be a63280a882356c733cf44030e7759e54d3f42aaf74e7a5ece70849845dd44dae, now is ${bufferToInt(blockTmp.header.number)}`);
		}

		checkRunBlockChain().then(() => {
			done();
		}).catch(err => {
			done(err);
		});
	});
})