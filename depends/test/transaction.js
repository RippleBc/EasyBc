const {assert, expect, should} = require("chai"); 
const Transaction = require("../transaction");
const utils = require("../utils");

const toBuffer = utils.toBuffer;

const privateKey = toBuffer("0x459705e79404b3604e4eef0aa1becedef1a227865a122826106f7f511682ea86");
const publicKey = toBuffer("0x873426d507b1ce4401a28908ce1af24b61aa0cc4187de39b812d994b656fd095120732955193857afd876066e9c481dea6968afe423ae104224b026ee5fddeca");
const from = toBuffer("0x6ea3ba30a7e81d92ad8aa2e359c5d8f297fc0fb1");
const to = toBuffer("0x5da3ba30a7e81d92ad8aa2e359c5d8f297fc0ff3");


describe("transaction test", function() {
	it("check privateKey and publicKey", function() {
		assert.equal(utils.isValidPrivate(privateKey), true, `privateKey 0x${privateKey.toString("hex")} is invalid`);
		assert.equal(utils.isValidPublic(publicKey), true, `publicKey 0x${publicKey.toString("hex")} is invalid`);
	})

	it("check signature", function() {
		let transaction = new Transaction({
			nonce: 255,
			to: to,
			value: 255
		});

		assert.equal(transaction.nonce.toString("hex"), "ff", `transaction.nonce should be ff, now is ${transaction.nonce.toString("hex")}`);
		assert.equal(transaction.to.toString("hex"), "5da3ba30a7e81d92ad8aa2e359c5d8f297fc0ff3", `transaction.to should be 5da3ba30a7e81d92ad8aa2e359c5d8f297fc0ff3, now is ${transaction.to.toString("hex")}`);
		assert.equal(transaction.value.toString("hex"), "ff", `transaction.value should be ff, now is ${transaction.value.toString("hex")}`);
		assert.equal(transaction.data.toString("hex"), "", `transaction.data should be ff, now is ${transaction.data.toString("hex")}`);

		// check failed signature
		let {state, msg} = transaction.validate();
		assert.equal(state, false, `transaction should be invalid`);
		assert.equal(msg.indexOf("invalid signature") >= 0, true, "transaction.validate should fail because of invalid signature");

		// check successed signature
		transaction.sign(privateKey);
		assert.equal(transaction.validate().state, true, `transaction should be valid`);
		assert.equal(transaction.from.toString("hex"), from.toString("hex"), `transaction.from shoud be ${from.toString("hex")}, now is ${transaction.from.toString("hex")}`);
  	assert.equal(transaction.getSenderPublicKey().toString("hex"), publicKey.toString("hex"), `transaction publicKey should be ${publicKey.toString("hex")}, now is ${transaction.getSenderPublicKey().toString("hex")}`);
  });
});