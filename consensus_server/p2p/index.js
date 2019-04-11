const { tcp, unl, privateKey } = require("../config.json");
const utils = require("../../depends/utils");
const { createClient, createServer, connectionsManager } = require("../../depends/fly");
const assert = require("assert");

const Buffer = utils.Buffer;

process[Symbol.for("privateKey")] = Buffer.from(privateKey, "hex");

const loggerP2p = process[Symbol.for("loggerP2p")];
const loggerNet = process[Symbol.for("loggerNet")];

const CHECK_CONNECT_INTERVAL = 10 * 1000;

class P2p
{
	constructor()
	{
		assert(typeof tcp.host === "string", `P2p constructor, tcp.host should be a String, now is ${typeof tcp.host}`);
		assert(typeof tcp.port === "number", `P2p constructor, tcp.port should be a Number, now is ${typeof tcp.port}`);
	}

	/**
	 * @param {Function} dispatcher
	 */
	async init(dispatcher)
	{
		assert(typeof dispatcher === "function", `P2p init, dispatcher should be a Function, now is ${typeof dispatcher}`);

		// init server
		const server = await createServer({
	    host: tcp.host,
	    port: tcp.port,
	    dispatcher: message => {
	    	dispatcher.call(this, message);
	    },
	    logger: loggerNet
	  });

		// init conn
		for(let i = 0; i < unl.length; i++)
		{
			const node = unl[i];

			try
			{
				await createClient({
					host: node.host,
					port: node.port,
					dispatcher: message => {
						loggerNet.error("this a: " + this.write);
			    	dispatcher.call(this, message);
			    },
					logger: loggerNet,
					address: Buffer.from(node.address, "hex")
				});
			}
			catch(e)
			{
				loggerP2p.error(`P2p init, connect to address: ${node.address}, host: ${node.host}, port: ${node.port} is failed, ${e}`);
			}
		}

		// check connections
		setTimeout(() => {
			// init conn
			for(let i = 0; i < unl.length; i++)
			{
				const node = unl[i];
				const connection = connectionsManager.get(Buffer.from(node.address, "hex"));

				if(!connection || connection.closed)
				{
					createClient({
						host: node.host,
						port: node.port,
						dispatcher: message => {
				    	dispatcher.call(this, message);
				    },
						logger: loggerNet,
						address: Buffer.from(node.address, "hex")
					}).then(connection => {
						loggerP2p.info(`P2p, reconnect to address: ${node.address}, host: ${node.host}, port: ${node.port} is successed`);
					}).catch(e => {
						loggerP2p.error(`P2p, reconnect to address: ${node.address}, host: ${node.host}, port: ${node.port} is failed, ${e}`);
					});
				}	
			}
		}, CHECK_CONNECT_INTERVAL);
	}

	send(address, cmd, data)
	{
		assert(typeof cmd === "number", `P2p send, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(address), `P2p send, data should be an Buffer, now is ${typeof address}`);
		
		const connection = connectionsManager.get(address);
		if(connection && !connection.closed)
		{
			try
			{
				connection.write(cmd, data);
			}
			catch(e)
			{
				const address = connection.address();
				loggerP2p.error(`P2p sendAll failed, address: ${connection.address}, host: ${address.address}, port: ${address.port}, family: ${address.family}, ${e}`);
			}
		}
	}

	sendAll(cmd, data)
	{
		assert(typeof cmd === "number", `P2p sendAll, cmd should be a Number, now is ${typeof cmd}`);

		for(let i = 0; i < unl.length; i++)
		{
			const connection = connectionsManager.get(Buffer.from(unl[i].address, "hex"));
			if(connection && !connection.closed)
			{
				try
				{
					connection.write(cmd, data);
				}
				catch(e)
				{
					const address = connection.address();
					loggerP2p.error(`P2p sendAll failed, address: ${connection.address}, host: ${address.address}, port: ${address.port}, family: ${address.family}, ${e}`);
				}
			}
		}
	}
}


module.exports = P2p;