const utils = require("../../utils");
const { createClient, createServer, connectionManager } = require("../");
const assert = require("assert");
const Message = require("../net/message");

const toBuffer = utils.toBuffer;
const bufferToInt = utils.bufferToInt;

process[Symbol.for("privateKey")] = toBuffer("0x459705e79404b3604e4eef0aa1becedef1a227865a122826106f7f511682ea86");

let testJSON = {
	"cmd": 1,
	"data": {
		"name": "walker",
		"age": 1
	}
}

testData = toBuffer(JSON.stringify(testJSON));

const server = createServer({
	host: "localhost",
	port: 8080,
	dispatcher: function(message) {
		console.log(`server receive message: ${message.data.toString()}`);

		assert.equal(bufferToInt(message.cmd), 10, `cmd should be 10, now is ${bufferToInt(message.cmd)}`);
		assert.equal(message.data.toString(), "walker", `data.name should be walker, now is ${message.data.toString()}`);
		
		this.write(10, "walker");
	}
});