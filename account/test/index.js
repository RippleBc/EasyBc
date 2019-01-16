const util = require("../../utils")
const Account = require("../index.js")
const assert = require("assert")

let acc = new Account({nonce: 1, balance: 100});
assert(util.bufferToInt(acc.nonce) === 1);
assert(util.bufferToInt(acc.balance) === 100);

let accSerialize = acc.serialize();

acc = new Account(accSerialize);

assert(util.bufferToInt(acc.nonce) === 1);
assert(util.bufferToInt(acc.balance) === 100);

console.log("test ok!!!");