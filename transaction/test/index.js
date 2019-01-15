const Transaction = require("../index.js")
const util = require("../../utils");
const assert = require("assert");

var privateKey = util.toBuffer("0xa2b7c064bec5dc347b06b12bf85c32ace7335464a9a8ace7a88a992b8c7cf392");

var tx = new Transaction();
tx.nonce = 1;
tx.value = 2;
tx.data = "hello";


tx.sign(privateKey);
assert(tx.validate() !== true, "validate error");

tx.to = "0x12";
tx.sign(privateKey);
assert(tx.validate() === true, "validate error");

var rawTx = [
  "0x01",
  "0x09184e72a000",
  "0x2710",
  "hello",
  "0x1c",
  "0x04bc34b177b6c0c86166f85aa3e0e5897565383685c39b76b9deb3b93e8c6a41",
  "0x4d0b2c4ae473ac5f862c7291d57bbe7725dcad6d40f0d181030d6236f11f14e5"
];

var tx2 = new Transaction(rawTx);

assert(tx2.validate() === true, "validate error");

assert(tx2.getSenderAddress().toString("hex") === "e277542de133732bd11ab15bca9d16f021f9e018", "error");

console.log("test ok!!!");
