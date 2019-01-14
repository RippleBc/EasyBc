const Cache = require("../cache")
const createDb = require("../../db")
const Trie = require("merkle-patricia-tree/secure")
const async = require("async")
const assert = require("assert");
const util = require("../../utils");
const Account = require("../../account");

let db = createDb();
let trie = new Trie(db);

let cacheInstance = new Cache(trie);

let privateKey1 = "0xaa05be899891ba99a09fdb1966edb7024ba5c8cfe44fe8eb3030dd516a14c972";
let pubKey1 = "0x0ed970bac0a0684cfd2f6846c741790a4984d0b151149ee8dc91128420a9e4c7fe56568aeeaacdcae34cc1d477a4ad8342cf4bdd388706ca800eb7c4871d88c7";
let accountAddress1 = util.toBuffer("0x166529ef641b20ec2319a011f9584005d1bd3571", "hex");

let privateKey2 = "0xa767c549d4d93c0201d5d42932398d0b3b2b0e21e12b69f5987b9d7aff9bdd38";
let pubKey2 = "0x8da17eff96ccf5b7d9eab6107654253c87b3eec55cbe0a74f48ad18a114e9d01991a651a8ab9bdd12c273a49a1c05ba6bb3fe2cdc09ac25cc5d4d62f266240b9";
let accountAddress2 = util.toBuffer("0xd24eddaec1bdca38941c6638ee51328aea2fb4e2", "hex");

let privateKey3 = "0x4fcc69009feda3f6e5153c8e585d5e7bddc0fcfbc3cfadd69101d30f3d200723";
let pubKey3 = "0xd3b687d0631d94b6ad011ebb6cdeadab0ea3e0104e4d5099bafa45f72188fd702cd583d008d502b82daf755acfcb520b480209ddf293063a10f19350c29d2f66";
let accountAddress3 = util.toBuffer("0x68cfa31e8831cbc4061cc26c51d0d4306b2a8b88", "hex");

let account1 = new Account({nonce: 1, balance: 100});  
let account2 = new Account({nonce: 1, balance: 200});  
let account3 = new Account({nonce: 1, balance: 300}); 

cacheInstance.put(accountAddress1, account1, false);
cacheInstance.put(accountAddress2, account2, false);
cacheInstance.put(accountAddress3, account3, false);

account1 = cacheInstance.get(accountAddress1);
account2 = cacheInstance.get(accountAddress2);
account3 = cacheInstance.get(accountAddress3);

assert(util.bufferToInt(account1.balance) === 100);
assert(util.bufferToInt(account2.balance) === 200);
assert(util.bufferToInt(account3.balance) === 300);

async.waterfall([
	function(cb) {
		cacheInstance.commit(function(err) {
			if(err)
			{
				return cb("commit fail");
			}
			cb();
		});
	},
	// 
	function(cb) {
		trie = new Trie(db);
		cacheInstance = new Cache(trie);
		cacheInstance.getOrLoad(util.toBuffer(accountAddress1, "hex"), cb);
	},
	function(account, cb) {
		account1 = account;
		cacheInstance.getOrLoad(util.toBuffer(accountAddress2, "hex"), cb);
	},
	function(account, cb) {
		account2 = account;
		cacheInstance.getOrLoad(util.toBuffer(accountAddress3, "hex"), cb);
	},
	function(account, cb) {
		account3 = account;
		assert(account1.exists === false);
		assert(account2.exists === false);
		assert(account3.exists === false);
		cb();
	},
	// 
	function(cb) {
		trie = new Trie(db, "0x742511f8fbffaafa6f1c587595f31e1c1d57aefdd9bfe5ccf387626da8fb41fe");
		cacheInstance = new Cache(trie);

		cacheInstance.getOrLoad(util.toBuffer(accountAddress1, "hex"), cb);
	},
	function(account, cb) {
		account1 = account;
		cacheInstance.getOrLoad(util.toBuffer(accountAddress2, "hex"), cb);
	},
	function(account, cb) {
		account2 = account;
		cacheInstance.getOrLoad(util.toBuffer(accountAddress3, "hex"), cb);
	},
	function(account, cb) {
		account3 = account;

		assert(account1.exists === true);
		assert(account2.exists === true);
		assert(account3.exists === true);

		assert(util.bufferToInt(account1.balance) === 100);
		assert(util.bufferToInt(account2.balance) === 200);
		assert(util.bufferToInt(account3.balance) === 300);
		cb();
	}
	], function(err) {
		if(!!err)
		{
			console.log(err);
			return;
		}
		console.log("test ok");
	});