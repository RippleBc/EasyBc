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

tx.to = "0x1234567891123456789112345678911234567891";
tx.sign(privateKey);
assert(tx.validate() === true, "validate error");

var rawTx = [
  "0x01",
  "0x1234567891123456789112345678911234567891",
  "0x2710",
  "hello",
  "0x1c",
  "0xf25dcf0fbbd3a8b629ab6f0a758cae100c2432a2fd761d75a81b9b08352156da",
  "0x3504bcfe0b27a31658ba34c292dbf05818c7e560dbd193f7cdb6500ccfbda94a"
];

var tx2 = new Transaction(rawTx);

assert(tx2.nonce.toString("hex") == "01", "err");
assert(tx2.to.toString("hex") == "1234567891123456789112345678911234567891", "err");
assert(tx2.value.toString("hex") == "2710", "err");
assert(tx2.data.toString() == "hello", "err");
assert(tx2.v.toString("hex") == "1c", "err");
assert(tx2.r.toString("hex") == "f25dcf0fbbd3a8b629ab6f0a758cae100c2432a2fd761d75a81b9b08352156da", "err");
assert(tx2.s.toString("hex") == "3504bcfe0b27a31658ba34c292dbf05818c7e560dbd193f7cdb6500ccfbda94a", "err");

assert(tx2.validate() === true, "validate error");

assert(tx2.getSenderAddress().toString("hex") === "e277542de133732bd11ab15bca9d16f021f9e018", "error");

console.log("test ok!!!");
