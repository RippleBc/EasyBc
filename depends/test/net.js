const Message = require("../fly/net/message");
const MessageChunk = require("../fly/net/message_chunk");
const MessageChunkQueue = require("../fly/net/message_chunk_queue");
const utils = require("../utils");
const { createClient, createServer, connectionManager } = require("../fly");
const {assert, expect, should} = require("chai"); 

const toBuffer = utils.toBuffer;

describe("net test", function() {
	it("check message", function() {
		// check property lost
		let err;
		let testJSON = {
			"data": {
				"name": "walker",
				"age": 1
			}
		}
		try
		{
			let message = new Message(toBuffer(JSON.stringify(testJSON)));
		}
		catch(e)
		{
			err = e;
		}
		if(err === undefined)
		{
			assert.equal(true, false, "new Message() should throw exception");
		}
		else if(err.toString().indexOf("cmd can not be undefined") === -1)
		{
			assert.equal(true, false, `new Message() should throw exception with the reason cmd can not be undefined, now is ${err}`);
		}

		// check new Message
		testJSON = {
			"cmd": 1,
			"data": {
				"name": "walker",
				"age": 1
			}
		}
		message = new Message(toBuffer(JSON.stringify(testJSON)));
		assert.equal(message.cmd, 1, `cmd should be 1, now is ${message.cmd}`);
		assert.equal(message.data.name, "walker", `data.name should be walker, now is ${message.data.name}`);
		assert.equal(message.data.age, 1, `data.age should be 1, now is ${message.data.age}`);
		assert.equal(message.length, 42, `length should be 42, now is ${message.length}`);

		// check serialize
		message = new Message();
		message.cmd = 1;
		message.data = {
			"name": "walker",
			"age": 1
		}

		assert.equal(message.serialize().toString().slice(4), `{"cmd":1,"data":{"name":"walker","age":1}}`, `message serialize should be {"cmd":1,"data":{"name":"walker","age":1}}, now is ${message.serialize().toString()}`);
	});

	it("check message chunk", function() {
		let testJSON = {
			"cmd": 1,
			"data": {
				"name": "walker",
				"age": 1
			}
		}
		let testBuffer = toBuffer(JSON.stringify(testJSON));
		let messageChunk = new MessageChunk(testBuffer);

		assert.equal(messageChunk.length, 42, `messageChunk.length should be 42, now is ${messageChunk.length}`);

		let data = messageChunk.read(4);
		assert.equal(data.toString(), `{"cm`, `data.toString() should be {"cm, now is ${data.toString()}`);

		data = messageChunk.read(4);
		assert.equal(data.toString(), `d":1`, `data.toString() should be d":1, now is ${data.toString()}`);

		assert.equal(messageChunk.remainDataSize, 34, `messageChunk.remainDataSize should be 34, now is ${messageChunk.length}`);

		data = messageChunk.readRemainData();
		assert.equal(data.toString(), `,"data":{"name":"walker","age":1}}`, `data.toString() should be ,"data":{"name":"walker","age":1}}, now is ${data.toString()}`);
	});

	it("check message chunk queue", function() {
		let testJSON = {
			"cmd": 1,
			"data": {
				"name": "walker",
				"age": 1
			}
		}

		const messageChunkQueue = new MessageChunkQueue();
		messageChunkQueue.push(utils.setLength(utils.toBuffer(42), 4));

		let testBuffer = toBuffer(JSON.stringify(testJSON));

		let chunkData = testBuffer.slice(0, 1);
		messageChunkQueue.push(chunkData);

		chunkData = testBuffer.slice(1, 2);
		messageChunkQueue.push(chunkData);

		chunkData = testBuffer.slice(2, 4);
		messageChunkQueue.push(chunkData);

		let message = messageChunkQueue.getMessage();
		assert.equal(message, undefined, `message should be undfined, now is ${message}`);

		chunkData = testBuffer.slice(4, 42);
		messageChunkQueue.push(chunkData);

		message = messageChunkQueue.getMessage();
		assert.equal(message.cmd, 1, `cmd should be 1, now is ${message.cmd}`);
		assert.equal(message.data.name, "walker", `data.name should be walker, now is ${message.data.name}`);
		assert.equal(message.data.age, 1, `data.age should be 1, now is ${message.data.age}`);
	});

	it("check server and client", function(done) {
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
				assert.equal(message.cmd, 1, `cmd should be 1, now is ${message.cmd}`);
				assert.equal(message.data.name, "walker", `data.name should be walker, now is ${message.data.name}`);
				assert.equal(message.data.age, 1, `data.age should be 1, now is ${message.data.age}`);
				assert.equal(message.length, 42, `length should be 42, now is ${message.length}`);
				this.write(new Message(testData).serialize());
			}
		});

		setTimeout(() => {
			createClient({
				host: "localhost",
				port: 8080,
				dispatcher: function(message) {
					assert.equal(message.cmd, 1, `cmd should be 1, now is ${message.cmd}`);
					assert.equal(message.data.name, "walker", `data.name should be walker, now is ${message.data.name}`);
					assert.equal(message.data.age, 1, `data.age should be 1, now is ${message.data.age}`);
					assert.equal(message.length, 42, `length should be 42, now is ${message.length}`);

					server.close();
					connectionManager.closeAll();

					done();
				}
			}).then(connection => {
				setTimeout(() => {
					connection.write(new Message(testData).serialize());
				}, 500);
			}).catch(e => {
				done(e);
			});
		}, 1000)
	});
});





