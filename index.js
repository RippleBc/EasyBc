const process = require("process")
const BlockChain = require("./block_chain");
const Block = require("./block");

process.on("uncaughtException", function (err) {
    console.error("An uncaught error occurred!");
    console.error(err.stack);
});