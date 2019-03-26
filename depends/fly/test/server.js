const utils = require("../../utils");
const { createClient, createServer, connectionManager } = require("../");
const assert = require("assert");
const Message = require("../net/message");

const toBuffer = utils.toBuffer;

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
		console.log(`server receive message: ${JSON.stringify(message.json)}`);

		assert(message.cmd == 1, `cmd should be 1, now is ${message.cmd}`);
		assert(message.data.name == "walker", `data.name should be walker, now is ${message.data.name}`);
		assert(message.data.age == 1, `data.age should be 1, now is ${message.data.age}`);
		assert(message.length == 42, `length should be 42, now is ${message.length}`);
		
		this.write(new Message(testData).serialize());
	}
});