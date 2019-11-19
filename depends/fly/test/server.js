const utils = require("../../utils");
const { createClient, createServer, connectionManager } = require("../");
const assert = require("assert");
const Message = require("../net/message");

const toBuffer = utils.toBuffer;
const bufferToInt = utils.bufferToInt;
const Buffer = utils.Buffer;

const privateKey = Buffer.from("7a82f175255e14747eb2eb6442da96d11b60147a5e1f1c864ae333105b7be6f6", "hex");

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
	},
	privateKey: privateKey
});