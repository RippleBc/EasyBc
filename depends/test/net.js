const Message = require("../fly/net/message");
const MessageChunk = require("../fly/net/message_chunk");
const MessageChunkQueue = require("../fly/net/message_chunk_queue");
const utils = require("../utils");
const { createClient, createServer, connectionManager } = require("../fly");
const {assert, expect, should} = require("chai"); 
const process = require("process");

const toBuffer = utils.toBuffer;
const bufferToInt = utils.bufferToInt;

process[Symbol.for("privateKey")] = toBuffer("0x459705e79404b3604e4eef0aa1becedef1a227865a122826106f7f511682ea86");
process[Symbol.for("publicKey")] = toBuffer("0x873426d507b1ce4401a28908ce1af24b61aa0cc4187de39b812d994b656fd095120732955193857afd876066e9c481dea6968afe423ae104224b026ee5fddeca");

describe("net test", function() {
	it("check message", function() {
		// check new Message
		testData = {
			cmd: 1,
			data: "walker"
		}
		message = new Message(testData);
		assert.equal(bufferToInt(message.cmd), 1, `cmd should be 1, now is ${bufferToInt(message.cmd)}`);
		assert.equal(message.data, "walker", `data should be walker, now is ${message.data}`);

		// check serialize
		message = new Message();
		message.cmd = 1;
		message.data = "walker"

		assert.equal(message.serialize().toString("hex"), "00000009c8018677616c6b6572", `message serialize should be 00000009c8018677616c6b6572, now is ${message.serialize().toString("hex")}`);
		assert.equal(message.length, 9, `message.length should 9, now is ${message.length}`);

	});

	it("check message chunk", function() {
		let testData = {
			"cmd": 1,
			"data": {
				"name": "walker",
				"age": 1
			}
		}
		let testBuffer = toBuffer(JSON.stringify(testData));
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
		let testData = {
			cmd: 1,
			data: "walker"
		}

		let testBuffer = toBuffer(new Message(testData).serialize());

		const messageChunkQueue = new MessageChunkQueue();

		let chunkData = testBuffer.slice(0, 2);
		messageChunkQueue.push(chunkData);

		chunkData = testBuffer.slice(2, 4);
		messageChunkQueue.push(chunkData);

		chunkData = testBuffer.slice(4, 8);
		messageChunkQueue.push(chunkData);

		let message = messageChunkQueue.getMessage();
		assert.equal(message, undefined, `message should be undfined, now is ${message}`);

		chunkData = testBuffer.slice(8, 13);
		messageChunkQueue.push(chunkData);

		message = messageChunkQueue.getMessage();
		assert.equal(bufferToInt(message.cmd), 1, `cmd should be 1, now is ${bufferToInt(message.cmd)}`);
		assert.equal(message.data.toString(), "walker", `data should be 1, now is ${message.data.toString()}`);
	});

	it("check server and client", function(done) {

		this.timeout(60000);

		const server = createServer({
			host: "localhost",
			port: 8080,
			dispatcher: function(message) {
				assert.equal(bufferToInt(message.cmd), 10, `cmd should be 10, now is ${bufferToInt(message.cmd)}`);
				assert.equal(message.data.toString(), "walker", `data.name should be walker, now is ${message.data.toString()}`);
				this.write(10, "walker");
			}
		});

		setTimeout(() => {
			createClient({
				host: "localhost",
				port: 8080,
				dispatcher: function(message) {
					assert.equal(bufferToInt(message.cmd), 10, `cmd should be 10, now is ${bufferToInt(message.cmd)}`);
					assert.equal(message.data.toString(), "walker", `data.name should be walker, now is ${message.data.toString()}`);

					server.close();
					connectionManager.closeAll();

					done();
				},
				address: toBuffer("0x6ea3ba30a7e81d92ad8aa2e359c5d8f297fc0fb1")
			}).then(connection => {
				connectionManager.get(toBuffer("0x6ea3ba30a7e81d92ad8aa2e359c5d8f297fc0fb1")).write(10, "walker");
			}).catch(e => {
				done(e);
			});
		}, 1000)
	});
});





