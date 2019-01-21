const Transaction = require("../index.js")
const util = require("../../utils");
const assert = require("assert");

let privateKey = util.toBuffer("0xa2b7c064bec5dc347b06b12bf85c32ace7335464a9a8ace7a88a992b8c7cf392");
let pubKey = util.privateToPublic(privateKey);
assert("d6c58408a883c4e0b3d34e62f1bc5abe15cfe320d29c2d8ecf460aa825c1a7a8e47f97caa822934542b0b75cc317fa856fd8902bf3d1eb1352c719ee3e7fe369" === pubKey.toString("hex"), "err");

let tx = new Transaction();
tx.nonce = 100;
tx.value = 4;
tx.data = "hello";

tx.sign(privateKey);
assert(tx.validate() !== true, "validate error");

tx.to = "0x1234567891123456789112345678911234567891";
tx.sign(privateKey);
assert(tx.validate() === true, "validate error");

assert("d6c58408a883c4e0b3d34e62f1bc5abe15cfe320d29c2d8ecf460aa825c1a7a8e47f97caa822934542b0b75cc317fa856fd8902bf3d1eb1352c719ee3e7fe369" === tx.getSenderPublicKey().toString("hex"), "err");

let rawTx = [
  "0x01",
  "0x1234567891123456789112345678911234567891",
  "0x2710",
  "hello",
  "0x1c",
  "0xf25dcf0fbbd3a8b629ab6f0a758cae100c2432a2fd761d75a81b9b08352156da",
  "0x3504bcfe0b27a31658ba34c292dbf05818c7e560dbd193f7cdb6500ccfbda94a"
];

let tx2 = new Transaction(rawTx);

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
