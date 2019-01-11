const Transaction = require("../index.js")
const util = require("../../utils");
const assert = require("assert");

var privateKey = util.toBuffer("0xa2b7c064bec5dc347b06b12bf85c32ace7335464a9a8ace7a88a992b8c7cf392");

var tx = new Transaction();
tx.nonce = 1;
tx.value = 2;
tx.data = "hello";


tx.sign(privateKey);
assert(tx.verifySignature() === true, "error");

assert(tx.serialize().toString("hex") == "0xf84c0180028568656c6c6f1ca01d8e9a407c32a01aec73661e21c57e5c5cd11b11db2dc49060ed0432e8fc6bafa06e55ef3fbf4aa6ae009de11b76c93330e233ab3afde74cbbb264f1a000c12fd7", "error");

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

assert(tx2.verifySignature() === true, "error");
{
  console.log("Signature Checks out!");
}

console.log("Senders Address: " + tx2.getSenderAddress().toString("hex"));
