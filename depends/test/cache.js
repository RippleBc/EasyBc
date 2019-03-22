const {assert, expect, should} = require("chai"); 
const Account = require("../account");
const Trie = require("../trie");
const Cache = require("../block_chain/cache");
const utils = require("../utils");

const toBuffer = utils.toBuffer;
const bufferToInt = utils.bufferToInt;

const trie = new Trie();
const cache = new Cache(trie);

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
 
describe("cache check", function(){
	it("check get default account", function(done) {

		const checkGetDefaultAccount = async function()
		{
			let acc1 = await cache.getOrLoad(address1);
			let acc2 = await cache.getOrLoad(address2);
			let acc3 = await cache.getOrLoad(address3);

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
			cache.put(address1, account1.serialize(), true);
			cache.put(address2, account2.serialize(), true);
			cache.put(address3, account3.serialize(), true);

			// check get
			let acc1 = cache.get(address1);
			let acc2 = cache.get(address2);
			let acc3 = cache.get(address3);

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
			await cache.flush();

			// check delete
			cache.del(address1);
			cache.del(address2);
			cache.del(address3);

			let acc1 = cache.get(address1);
			let acc2 = cache.get(address2);
			let acc3 = cache.get(address3);

			assert.equal(bufferToInt(acc1.nonce), 0, `acc1.nonce should be 0, now is ${bufferToInt(acc1.nonce)}`);
			assert.equal(bufferToInt(acc1.balance), 0, `acc1.balance should be 0, now is ${bufferToInt(acc1.balance)}`);
			assert.equal(bufferToInt(acc2.nonce), 0, `acc2.nonce should be 0, now is ${bufferToInt(acc2.nonce)}`);
			assert.equal(bufferToInt(acc2.balance), 0, `acc2.balance should be 0, now is ${bufferToInt(acc2.balance)}`);
			assert.equal(bufferToInt(acc3.nonce), 0, `acc3.nonce should be 0, now is ${bufferToInt(acc3.nonce)}`);
			assert.equal(bufferToInt(acc3.balance), 0, `acc3.balance should be 0, now is ${bufferToInt(acc3.balance)}`);

			acc1 = await cache.getOrLoad(address1);
			acc2 = await cache.getOrLoad(address2);
			acc3 = await cache.getOrLoad(address3);

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
			cache.del(address1);
			cache.del(address2);
			cache.del(address3);

			acc1 = cache.get(address1);
			acc2 = cache.get(address2);
			acc3 = cache.get(address3);

			assert.equal(bufferToInt(acc1.nonce), 0, `acc1.nonce should be 0, now is ${bufferToInt(acc1.nonce)}`);
			assert.equal(bufferToInt(acc1.balance), 0, `acc1.balance should be 0, now is ${bufferToInt(acc1.balance)}`);
			assert.equal(bufferToInt(acc2.nonce), 0, `acc2.nonce should be 0, now is ${bufferToInt(acc2.nonce)}`);
			assert.equal(bufferToInt(acc2.balance), 0, `acc2.balance should be 0, now is ${bufferToInt(acc2.balance)}`);
			assert.equal(bufferToInt(acc3.nonce), 0, `acc3.nonce should be 0, now is ${bufferToInt(acc3.nonce)}`);
			assert.equal(bufferToInt(acc3.balance), 0, `acc3.balance should be 0, now is ${bufferToInt(acc3.balance)}`);

			// check warm
			await cache.warm([address1, address2, address3]);

			acc1 = cache.get(address1);
			acc2 = cache.get(address2);
			acc3 = cache.get(address3);

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
			cache.clear();
			
			acc1 = cache.get(address1);
			acc2 = cache.get(address2);
			acc3 = cache.get(address3);

			assert.equal(bufferToInt(acc1.nonce), 0, `acc1.nonce should be 0, now is ${bufferToInt(acc1.nonce)}`);
			assert.equal(bufferToInt(acc1.balance), 0, `acc1.balance should be 0, now is ${bufferToInt(acc1.balance)}`);
			assert.equal(bufferToInt(acc2.nonce), 0, `acc2.nonce should be 0, now is ${bufferToInt(acc2.nonce)}`);
			assert.equal(bufferToInt(acc2.balance), 0, `acc2.balance should be 0, now is ${bufferToInt(acc2.balance)}`);
			assert.equal(bufferToInt(acc3.nonce), 0, `acc3.nonce should be 0, now is ${bufferToInt(acc3.nonce)}`);
			assert.equal(bufferToInt(acc3.balance), 0, `acc3.balance should be 0, now is ${bufferToInt(acc3.balance)}`);

			acc1 = await cache.getOrLoad(address1);
			acc2 = await cache.getOrLoad(address2);
			acc3 = await cache.getOrLoad(address3);

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