const { tcp, unl, privateKey } = require("../config.json");
const utils = require("../../depends/utils");
const { createClient, createServer, connectionsManager } = require("../../depends/fly");
const assert = require("assert");

const toBuffer = utils.toBuffer;

process[Symbol.for("privateKey")] = toBuffer(privateKey);

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

	async init(dispatcher)
	{
		// init server
		const server = createServer({
	    host: tcp.host,
	    port: tcp.port,
	    dispatcher: dispatcher,
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
					dispatcher: dispatcher,
					logger: loggerNet,
					address: toBuffer(node.address)
				});

				loggerP2p.info(`P2p init, connect to address: ${node.address}, host: ${node.host}, port: ${node.port} is successed`);
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
				const connection = connectionsManager.get(toBuffer(node.address));

				if(!connection || connection.closed)
				{
					createClient({
						host: node.host,
						port: node.port,
						dispatcher: dispatcher,
						logger: loggerNet,
						address: toBuffer(node.address)
					}).then(connection => {
						loggerP2p.info(`P2p, reconnect to address: ${node.address}, host: ${node.host}, port: ${node.port} is successed`);
					}).catch(e => {
						loggerP2p.error(`P2p, reconnect to address: ${node.address}, host: ${node.host}, port: ${node.port} is failed, ${e}`);
					});
				}	
			}
		}, CHECK_CONNECT_INTERVAL);
	}

	sendAll(cmd, data)
	{
		assert(typeof cmd === "number", `P2p sendAll, cmd should be a Number, now is ${typeof cmd}`);

		for(let i = 0; i < unl.length; i++)
		{
			const connection = connectionsManager.get(toBuffer(unl[i].address));
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