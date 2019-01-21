const assert = require("assert")
const Processor = require("../processor")
const util = require("../../utils")
const path = require("path")
const process = require("process")

process.on("uncaughtException", function (err) {
    console.error("An uncaught error occurred!");
    console.error(err.stack);
});

util.delDir(path.join(__dirname, "../../db/data"));

var rawTx = [
  "0x01",
  "0x1234567891123456789112345678911234567891",
  "0x2710",
  "hello",
  "0x1c",
  "0xf25dcf0fbbd3a8b629ab6f0a758cae100c2432a2fd761d75a81b9b08352156da",
  "0x3504bcfe0b27a31658ba34c292dbf05818c7e560dbd193f7cdb6500ccfbda94a"
];

let processor = new Processor();
describe("process transaction", function() {
  it("step 1", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(rawTx, done);
  });

  it("step 2", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(rawTx, done);
  });

  it("step 3", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(rawTx, done);
  });

  it("step 4", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(rawTx, done);
  });

  it("step 5", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(rawTx, done);
  });

  it("step 6", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(rawTx, done);
  });

  it("step 7", function(done) {
  	this.timeout(10000);
  	processor.processTransaction(rawTx, done);
  });
});
