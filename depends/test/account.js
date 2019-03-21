const {assert, expect, should} = require("chai"); 
const Account = require("../account");
const utils = require("../utils");

const rlp = utils.rlp;
const intToBuffer = utils.intToBuffer;

describe("accout test", function() {
	it("account constructor", function() {
		// Object
		let account1 = new Account({
			nonce: 255,
			balance: 255
		});
		// Array
		let account2 = new Account([255, 255]);
		// Buffer
		let account3 = new Account(rlp.encode([intToBuffer(255), intToBuffer(255)]));
		// String
		let account4 = new Account(`0x${rlp.encode([intToBuffer(255), intToBuffer(255)]).toString("hex")}`);

		assert.equal(account1.nonce.toString("hex"), "ff", `account1.nonce should be ff, now is ${account1.nonce.toString("hex")}`);
		assert.equal(account1.balance.toString("hex"), "ff", `account1.balance should be ff, now is ${account1.balance.toString("hex")}`);
		assert.equal(account1.serialize().toString("hex"), account2.serialize().toString("hex"), `account1 should be equal to account2, now account1 is ${JSON.stringify(account1.toJSON())}, account2 is ${JSON.stringify(account2.toJSON())}`);
   	assert.equal(account1.serialize().toString("hex"), account3.serialize().toString("hex"), `account1 should be equal to account3, now account1 is ${JSON.stringify(account1.toJSON())}, account3 is ${JSON.stringify(account3.toJSON())}`);
   	assert.equal(account1.serialize().toString("hex"), account4.serialize().toString("hex"), `account1 should be equal to account4, now account1 is ${JSON.stringify(account1.toJSON())}, account4 is ${JSON.stringify(account4.toJSON())}`);
  });
});