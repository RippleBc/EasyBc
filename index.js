const process = require("process")
const blockChain = require("./block_chain");

process.on("uncaughtException", function (err) {
    console.error("An uncaught error occurred!");
    console.error(err.stack);
});



