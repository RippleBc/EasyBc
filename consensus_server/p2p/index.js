const { tcp, unl } = require("./config.json");
const utils = require("../depends/utils");
const { createClient, createServer, connectionsManager } = require("../depends/fly");
const assert = require("assert");

process[Symbol.for("privateKey")] = toBuffer(config.privateKey);

class P2P
{
	constructor()
	{
		assert(typeof tcp.host === "string", `P2P constructor net should be a String, now is ${typeof tcp.host}`);
		assert(typeof tcp.number === "number", `P2P constructor net should be a Number, now is ${typeof tcp.host}`);
	}

	async init(dispatcher)
	{
		// init server
		const server = createServer({
	    host: tcp.host,
	    port: tcp.port,
	    dispatcher: dispatcher;
	  });

		// init conn
		createClient({
			host: "localhost",
			port: 8080,
			dispatcher: function(message) {
				assert.equal(bufferToInt(message.cmd), 10, `cmd should be 10, now is ${bufferToInt(message.cmd)}`);
				assert.equal(message.data.toString(), "walker", `data.name should be walker, now is ${message.data.toString()}`);

				server.close();

				done();
			},
			address: toBuffer("0x6ea3ba30a7e81d92ad8aa2e359c5d8f297fc0fb1")
		}).then(connection => {
			connectionManager.get(toBuffer("0x6ea3ba30a7e81d92ad8aa2e359c5d8f297fc0fb1")).write(10, "walker");
		}).catch(e => {
			done(e);
		});
	}


}
