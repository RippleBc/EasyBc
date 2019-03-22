const {assert, expect, should} = require("chai"); 
const Account = require("../account");
const Trie = require("merkle-patricia-tree");
const Cache = require("../block_chain/cache");

const cache = new Cache(new Trie());

const address1 = "0x01";
const account1 = new Account();

const address2 = "0x01";
const account2 = new Account();

const address3 = "0x01";
const account3 = new Account();
 
describe("cache check", function(){
	it("check warm", function() {
		
	})
})