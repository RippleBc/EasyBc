const {assert, expect, should} = require("chai"); 
const Transaction = require("../transaction");
const Block = require("../block");
const utils = require("../utils");
const async = require("async");

const toBuffer = utils.toBuffer;

const privateKey = toBuffer("0x459705e79404b3604e4eef0aa1becedef1a227865a122826106f7f511682ea86");
const publicKey = toBuffer("0x873426d507b1ce4401a28908ce1af24b61aa0cc4187de39b812d994b656fd095120732955193857afd876066e9c481dea6968afe423ae104224b026ee5fddeca");
const from = toBuffer("0x6ea3ba30a7e81d92ad8aa2e359c5d8f297fc0fb1");
const to = toBuffer("0x5da3ba30a7e81d92ad8aa2e359c5d8f297fc0ff3");

const transaction = new Transaction({
	nonce: 255,
	to: to,
	value: 255,
	data: "0xd3d3"
});

describe("block test", function() {
	it("check privateKey and publicKey", function(done) {
		assert.equal(utils.isValidPrivate(privateKey), true, `privateKey 0x${privateKey.toString("hex")} is invalid`);
		assert.equal(utils.isValidPublic(publicKey), true, `publicKey 0x${publicKey.toString("hex")} is invalid`);
		done();
	});

	it("check signature", function(done) {
		// check alias
		assert.equal(transaction.data.toString("hex"), "d3d3", `transaction.data should be d3d3, now is ${transaction.data.toString("hex")}`);
		assert.equal(transaction.input.toString("hex"), "d3d3", `transaction.input should be d3d3, now is ${transaction.input.toString("hex")}`);
		transaction.data = "0xd4d4";
		assert.equal(transaction.data.toString("hex"), "d4d4", `transaction.data should be d4d4, now is ${transaction.data.toString("hex")}`);
		assert.equal(transaction.input.toString("hex"), "d4d4", `transaction.input should be d4d4, now is ${transaction.input.toString("hex")}`);
		transaction.input = "0xd5d5";
		assert.equal(transaction.data.toString("hex"), "d4d4", `transaction.data should be d4d4, now is ${transaction.data.toString("hex")}`);
		assert.equal(transaction.input.toString("hex"), "d4d4", `transaction.input should be d4d4, now is ${transaction.input.toString("hex")}`);

		// check successed signature
		transaction.sign(privateKey);
		assert.equal(transaction.validate().state, true, `transaction should be valid`);
		assert.equal(transaction.from.toString("hex"), from.toString("hex"), `transaction.from shoud be ${from.toString("hex")}, now is ${transaction.from.toString("hex")}`);
  	assert.equal(transaction.getSenderPublicKey().toString("hex"), publicKey.toString("hex"), `transaction publicKey should be ${publicKey.toString("hex")}, now is ${transaction.getSenderPublicKey().toString("hex")}`);
  	done()
  });

	it("check block", function(done) {
		const timeNow = "0x456321987";

		const parentBlock = new Block({
			header: {
				number: 1,
				timestamp: timeNow,
				transactionsTrie: "0x0331622c3494d4fe829e1f31038b83270a0a5894b6715b13aa41c4a3859d2cbc"
			},
			transactions: [transaction, transaction, transaction]
		});

		const block = new Block({
			header: {
				parentHash: "0x43c0c682c23b5f6e216764fa84a0e85c026dc0534879020e5d2ce77f083ceb6e",
				number: 2,
				timestamp: timeNow + 2,
				transactionsTrie: "0x0331622c3494d4fe829e1f31038b83270a0a5894b6715b13aa41c4a3859d2cbc"
			},
			transactions: [transaction, transaction, transaction, transaction]
		});

		const checkBlock = async function()
		{
			let validateResult = await parentBlock.validate(new Block());
			if(!validateResult.state)
			{
				await Promise.reject(validateResult.msg);
			}
			validateResult = await block.validate(parentBlock);
			if(!validateResult.state)
			{
				await Promise.reject(validateResult.msg);
			}
			// change number
			block.header.number = 1;
			validateResult = await block.validate(parentBlock);
			if(validateResult.state)
			{
				await Promise.reject("change number, block validate should failed");
			}
			else if(validateResult.msg.indexOf("number") === -1)
			{
				await Promise.reject(`change number, block validate should failed, and the failed reason should be invalid number, now is ${validateResult.msg}`);
			}
			block.header.number = 2;
			validateResult = await block.validate(parentBlock);
			if(!validateResult.state)
			{
				await Promise.reject(validateResult.msg);
			}

			// change timestamp
			block.header.timestamp = timeNow;
			validateResult = await block.validate(parentBlock);
			if(validateResult.state)
			{
				await Promise.reject("change timestamp, block validate should failed");
			}
			else if(validateResult.msg.indexOf("timestamp") === -1)
			{
				await Promise.reject(`change timestamp, block validate should failed, and the failed reason should be invalid number, now is ${validateResult.msg}`);
			}
			block.header.timestamp = timeNow + 2;
			validateResult = await block.validate(parentBlock);
			if(!validateResult.state)
			{
				await Promise.reject(validateResult.msg);;
			}

			// change parentHash
			block.header.parentHash = "0x0000000000000000000000000000000000000000000000000000000000000001";
			validateResult = await block.validate(parentBlock);
			if(validateResult.state)
			{
				await Promise.reject("change parentHash, block validate should failed");
			}
			else if(validateResult.msg.indexOf("parentHash") === -1)
			{
				await Promise.reject(`change parentHash, block validate should failed, and the failed reason should be invalid number, now is ${validateResult.msg}`);
			}
			block.header.parentHash = "0x43c0c682c23b5f6e216764fa84a0e85c026dc0534879020e5d2ce77f083ceb6e";
			validateResult = await block.validate(parentBlock);
			if(!validateResult.state)
			{
				await Promise.reject(validateResult.msg);
			}
		}
		
		checkBlock().then(() => {
			done();
		}).catch(e => {
			done(e.stack ? e.stack : e.toString());
		});
		
	});
});