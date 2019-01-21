const assert = require("assert")
const Processor = require("../processor")
const util = require("../../utils")
const path = require("path")
const Transaction = require("../../transaction")
const process = require("process")

process.on("uncaughtException", function (err) {
    console.error("An uncaught error occurred!");
    console.error(err.stack);
});

var privateKey = util.toBuffer("0xa2b7c064bec5dc347b06b12bf85c32ace7335464a9a8ace7a88a992b8c7cf392");

util.delDir(path.join(__dirname, "../../db/data"));
var tx1 = new Transaction();
tx1.nonce = 1;
tx1.value = "0x2345";
tx1.data = "hello";
tx1.to = "0x1234567891123456789112345678911234567891";
tx1.sign(privateKey);
assert(tx1.validate() === true, "validate error");

var tx2 = new Transaction();
tx2.nonce = 2;
tx2.value = "0x2345";
tx2.data = "hello";
tx2.to = "0x1234567891123456789112345678911234567891";
tx2.sign(privateKey);
assert(tx2.validate() === true, "validate error");

var tx3 = new Transaction();
tx3.nonce = 3;
tx3.value = "0x2345";
tx3.data = "hello";
tx3.to = "0x1234567891123456789112345678911234567891";
tx3.sign(privateKey);
assert(tx3.validate() === true, "validate error");

var tx4 = new Transaction();
tx4.nonce = 4;
tx4.value = "0x2345";
tx4.data = "hello";
tx4.to = "0x1234567891123456789112345678911234567891";
tx4.sign(privateKey);
assert(tx4.validate() === true, "validate error");

var tx5 = new Transaction();
tx5.nonce = 5;
tx5.value = "0x2345";
tx5.data = "hello";
tx5.to = "0x1234567891123456789112345678911234567891";
tx5.sign(privateKey);
assert(tx5.validate() === true, "validate error");

var tx6 = new Transaction();
tx6.nonce = 6;
tx6.value = "0x2345";
tx6.data = "hello";
tx6.to = "0x1234567891123456789112345678911234567891";
tx6.sign(privateKey);
assert(tx6.validate() === true, "validate error");

var tx7 = new Transaction();
tx7.nonce = 7;
tx7.value = "0x2345";
tx7.data = "hello";
tx7.to = "0x1234567891123456789112345678911234567891";
tx7.sign(privateKey);
assert(tx7.validate() === true, "validate error");

var tx8 = new Transaction();
tx8.nonce = 8;
tx8.value = "0x2345";
tx8.data = "hello";
tx8.to = "0x1234567891123456789112345678911234567891";
tx8.sign(privateKey);
assert(tx8.validate() === true, "validate error");

let processor = new Processor();
describe("process transaction", function() {
  it("step 1", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(tx1, done);
  });

  it("step 2", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(tx2, done);
  });

  it("step 3", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(tx3, done);
  });

  it("step 4", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(tx4, done);
  });

  it("step 5", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(tx5, done);
  });

  it("step 6", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(tx6, done);
  });

  it("step 7", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(tx7, done);
  });

  it("step 8", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(tx8, done);
  });
});
