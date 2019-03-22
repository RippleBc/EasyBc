const {assert, expect, should} = require("chai"); 
const Account = require("../account");
const StateManager = require("../block_chain/stateManager");
const utils = require("../utils");

const toBuffer = utils.toBuffer;
const bufferToInt = utils.bufferToInt;

const stateManager = new StateManager();

const address1 = toBuffer("0x01");
const account1 = new Account({
	nonce: 1,
	balance: 1
});

const address2 = toBuffer("0x02");
const account2 = new Account({
	nonce: 2,
	balance: 2
});

const address3 = toBuffer("0x03");
const account3 = new Account({
	nonce: 3,
	balance: 3
});
 
describe("stateManager check", function(){
	it("check get default account", function(done) {

		const checkGetDefaultAccount = async function()
		{
			let acc1 = await stateManager.getAccount(address1);
			let acc2 = await stateManager.getAccount(address2);
			let acc3 = await stateManager.getAccount(address3);

			assert.equal(bufferToInt(acc1.nonce), 0, `acc1.nonce should be 0, now is ${bufferToInt(acc1.nonce)}`);
			assert.equal(bufferToInt(acc1.balance), 0, `acc1.balance should be 0, now is ${bufferToInt(acc1.balance)}`);
			assert.equal(bufferToInt(acc2.nonce), 0, `acc2.nonce should be 0, now is ${bufferToInt(acc2.nonce)}`);
			assert.equal(bufferToInt(acc2.balance), 0, `acc2.balance should be 0, now is ${bufferToInt(acc2.balance)}`);
			assert.equal(bufferToInt(acc3.nonce), 0, `acc3.nonce should be 0, now is ${bufferToInt(acc3.nonce)}`);
			assert.equal(bufferToInt(acc3.balance), 0, `acc3.balance should be 0, now is ${bufferToInt(acc3.balance)}`);
		}

		checkGetDefaultAccount().then(() => {
			done();
		}).catch(err => {
			done(err);
		})
	});

	it("check put", function(done) {

		const checkPut = async function()
		{
			// check put
			stateManager.putAccount(address1, account1.serialize());
			stateManager.putAccount(address2, account2.serialize());
			stateManager.putAccount(address3, account3.serialize());

			// check get
			let acc1 = stateManager.cache.get(address1);
			let acc2 = stateManager.cache.get(address2);
			let acc3 = stateManager.cache.get(address3);

			assert.equal(bufferToInt(acc1.nonce), 1, `acc1.nonce should be 1, now is ${bufferToInt(acc1.nonce)}`);
			assert.equal(bufferToInt(acc1.balance), 1, `acc1.balance should be 1, now is ${bufferToInt(acc1.balance)}`);
			assert.equal(bufferToInt(acc2.nonce), 2, `acc2.nonce should be 2, now is ${bufferToInt(acc2.nonce)}`);
			assert.equal(bufferToInt(acc2.balance), 2, `acc2.balance should be 2, now is ${bufferToInt(acc2.balance)}`);
			assert.equal(bufferToInt(acc3.nonce), 3, `acc3.nonce should be 3, now is ${bufferToInt(acc3.nonce)}`);
			assert.equal(bufferToInt(acc3.balance), 3, `acc3.balance should be 3, now is ${bufferToInt(acc3.balance)}`);
		}

		checkPut().then(() => {
			done()
		}).catch(err => {
			done(err)
		})
	});

	it("check flush", function(done) {

		const checkFlush = async function()
		{
			await stateManager.flushCache();

			// check delete
			stateManager.delAccount(address1);
			stateManager.delAccount(address2);
			stateManager.delAccount(address3);

			let acc1 = stateManager.cache.get(address1);
			let acc2 = stateManager.cache.get(address2);
			let acc3 = stateManager.cache.get(address3);

			assert.equal(bufferToInt(acc1.nonce), 0, `acc1.nonce should be 0, now is ${bufferToInt(acc1.nonce)}`);
			assert.equal(bufferToInt(acc1.balance), 0, `acc1.balance should be 0, now is ${bufferToInt(acc1.balance)}`);
			assert.equal(bufferToInt(acc2.nonce), 0, `acc2.nonce should be 0, now is ${bufferToInt(acc2.nonce)}`);
			assert.equal(bufferToInt(acc2.balance), 0, `acc2.balance should be 0, now is ${bufferToInt(acc2.balance)}`);
			assert.equal(bufferToInt(acc3.nonce), 0, `acc3.nonce should be 0, now is ${bufferToInt(acc3.nonce)}`);
			assert.equal(bufferToInt(acc3.balance), 0, `acc3.balance should be 0, now is ${bufferToInt(acc3.balance)}`);

			acc1 = await stateManager.getAccount(address1);
			acc2 = await stateManager.getAccount(address2);
			acc3 = await stateManager.getAccount(address3);

			assert.equal(bufferToInt(acc1.nonce), 1, `acc1.nonce should be 1, now is ${bufferToInt(acc1.nonce)}`);
			assert.equal(bufferToInt(acc1.balance), 1, `acc1.balance should be 1, now is ${bufferToInt(acc1.balance)}`);
			assert.equal(bufferToInt(acc2.nonce), 2, `acc2.nonce should be 2, now is ${bufferToInt(acc2.nonce)}`);
			assert.equal(bufferToInt(acc2.balance), 2, `acc2.balance should be 2, now is ${bufferToInt(acc2.balance)}`);
			assert.equal(bufferToInt(acc3.nonce), 3, `acc3.nonce should be 3, now is ${bufferToInt(acc3.nonce)}`);
			assert.equal(bufferToInt(acc3.balance), 3, `acc3.balance should be 3, now is ${bufferToInt(acc3.balance)}`);

		}

		checkFlush().then(() => {
			done()
		}).catch(err => {
			done(err)
		})
	});

	it("check warm", function(done) {

		const checkWarm = async function()
		{
			// check delete
			stateManager.delAccount(address1);
			stateManager.delAccount(address2);
			stateManager.delAccount(address3);

			acc1 = stateManager.cache.get(address1);
			acc2 = stateManager.cache.get(address2);
			acc3 = stateManager.cache.get(address3);

			assert.equal(bufferToInt(acc1.nonce), 0, `acc1.nonce should be 0, now is ${bufferToInt(acc1.nonce)}`);
			assert.equal(bufferToInt(acc1.balance), 0, `acc1.balance should be 0, now is ${bufferToInt(acc1.balance)}`);
			assert.equal(bufferToInt(acc2.nonce), 0, `acc2.nonce should be 0, now is ${bufferToInt(acc2.nonce)}`);
			assert.equal(bufferToInt(acc2.balance), 0, `acc2.balance should be 0, now is ${bufferToInt(acc2.balance)}`);
			assert.equal(bufferToInt(acc3.nonce), 0, `acc3.nonce should be 0, now is ${bufferToInt(acc3.nonce)}`);
			assert.equal(bufferToInt(acc3.balance), 0, `acc3.balance should be 0, now is ${bufferToInt(acc3.balance)}`);

			// check warm
			await stateManager.warmCache([address1, address2, address3]);

			acc1 = stateManager.cache.get(address1);
			acc2 = stateManager.cache.get(address2);
			acc3 = stateManager.cache.get(address3);

			assert.equal(bufferToInt(acc1.nonce), 1, `acc1.nonce should be 1, now is ${bufferToInt(acc1.nonce)}`);
			assert.equal(bufferToInt(acc1.balance), 1, `acc1.balance should be 2, now is ${bufferToInt(acc1.balance)}`);
			assert.equal(bufferToInt(acc2.nonce), 2, `acc2.nonce should be 2, now is ${bufferToInt(acc2.nonce)}`);
			assert.equal(bufferToInt(acc2.balance), 2, `acc2.balance should be 2, now is ${bufferToInt(acc2.balance)}`);
			assert.equal(bufferToInt(acc3.nonce), 3, `acc3.nonce should be 3, now is ${bufferToInt(acc3.nonce)}`);
			assert.equal(bufferToInt(acc3.balance), 3, `acc3.balance should be 3, now is ${bufferToInt(acc3.balance)}`);

		}

		checkWarm().then(() => {
			done()
		}).catch(err => {
			done(err)
		})
	});

	it("check clear", function(done) {
		const checkClear = async function()
		{
			stateManager.clearCache();
			
			acc1 = stateManager.cache.get(address1);
			acc2 = stateManager.cache.get(address2);
			acc3 = stateManager.cache.get(address3);

			assert.equal(bufferToInt(acc1.nonce), 0, `acc1.nonce should be 0, now is ${bufferToInt(acc1.nonce)}`);
			assert.equal(bufferToInt(acc1.balance), 0, `acc1.balance should be 0, now is ${bufferToInt(acc1.balance)}`);
			assert.equal(bufferToInt(acc2.nonce), 0, `acc2.nonce should be 0, now is ${bufferToInt(acc2.nonce)}`);
			assert.equal(bufferToInt(acc2.balance), 0, `acc2.balance should be 0, now is ${bufferToInt(acc2.balance)}`);
			assert.equal(bufferToInt(acc3.nonce), 0, `acc3.nonce should be 0, now is ${bufferToInt(acc3.nonce)}`);
			assert.equal(bufferToInt(acc3.balance), 0, `acc3.balance should be 0, now is ${bufferToInt(acc3.balance)}`);

			acc1 = await stateManager.getAccount(address1);
			acc2 = await stateManager.getAccount(address2);
			acc3 = await stateManager.getAccount(address3);

			assert.equal(bufferToInt(acc1.nonce), 1, `acc1.nonce should be 1, now is ${bufferToInt(acc1.nonce)}`);
			assert.equal(bufferToInt(acc1.balance), 1, `acc1.balance should be 1, now is ${bufferToInt(acc1.balance)}`);
			assert.equal(bufferToInt(acc2.nonce), 2, `acc2.nonce should be 2, now is ${bufferToInt(acc2.nonce)}`);
			assert.equal(bufferToInt(acc2.balance), 2, `acc2.balance should be 2, now is ${bufferToInt(acc2.balance)}`);
			assert.equal(bufferToInt(acc3.nonce), 3, `acc3.nonce should be 3, now is ${bufferToInt(acc3.nonce)}`);
			assert.equal(bufferToInt(acc3.balance), 3, `acc3.balance should be 3, now is ${bufferToInt(acc3.balance)}`);
		}
		
		checkClear().then(() => {
			done()
		}).catch(err => {
			done(err)
		})
	});
})