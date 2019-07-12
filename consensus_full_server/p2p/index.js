const { tcp } = require("../config.json");
const utils = require("../../depends/utils");
const { createClient, createServer, connectionsManager } = require("../../depends/fly");
const assert = require("assert");

const unl = process[Symbol.for("unl")];
const fullUnl = process[Symbol.for("fullUnl")];

const Buffer = utils.Buffer;

const loggerP2p = process[Symbol.for("loggerP2p")];
const loggerNet = process[Symbol.for("loggerNet")];
const unlManager = process[Symbol.for("unlManager")];

const CHECK_CONNECT_INTERVAL = 10 * 1000;

class P2p
{
	/**
	 * @param {Function} dispatcher
	 */
	constructor(dispatcher)
	{
		assert(typeof dispatcher === "function", `P2p constructor, dispatcher should be a Function, now is ${typeof dispatcher}`)
		assert(typeof tcp.host === "string", `P2p constructor, tcp.host should be a String, now is ${typeof tcp.host}`);
		assert(typeof tcp.port === "number", `P2p constructor, tcp.port should be a Number, now is ${typeof tcp.port}`);

		this.dispatcher = dispatcher;

		connectionsManager.on("addressConnected", address => {
			assert(typeof address === 'string', `addressConnected handler, address shoule be an Array, now is ${typeof address}`)

			unlManager.setNodesOnline([address])
		});

		connectionsManager.on("addressClosed", address => {

			assert(typeof address === 'string', `addressClosed handler, address shoule be an Array, now is ${typeof address}`)

			unlManager.setNodesOffline([address])
		});
	}

	async init()
	{
		// init server
		const server = await createServer({
			host: tcp.host,
			port: tcp.port,
			dispatcher: this.dispatcher,
			logger: loggerNet
		});

		// init conn
		for(let i = 0; i < fullUnl.length; i++)
		{
			const node = fullUnl[i];

			try
			{
				const connection = await createClient({
					host: node.host,
					port: node.p2pPort,
					dispatcher: this.dispatcher,
					logger: loggerNet,
					address: Buffer.from(node.address, "hex")
				});
			}
			catch(e)
			{
				// 
				unlManager.setNodesOffline([node.address])

				loggerP2p.error(`P2p init, connect to address: ${node.address}, host: ${node.host}, port: ${node.p2pPort}, ${process[Symbol.for("getStackInfo")](e)}`);
			}
		}

		// check connections
		setInterval(() => {
			// clear invalid connections
			connectionsManager.clearInvalidConnections(fullUnl.map(node => node.address))

			// try to reconnect other nodes
			this.reconnectAll();

		}, CHECK_CONNECT_INTERVAL);
	}

	send(address, cmd, data)
	{
		assert(typeof cmd === "number", `P2p send, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(address), `P2p send, data should be an Buffer, now is ${typeof address}`);
		
		const connection = connectionsManager.get(address);
		if(connection && connection.checkIfCanWrite())
		{
			try
			{
				connection.write(cmd, data);
			}
			catch(e)
			{
				loggerP2p.error(`P2p send, send msg to address: ${connection.address}, host: ${connection.address().address}, port: ${connection.address().port}, ${process[Symbol.for("getStackInfo")](e)}`);
			}
		}
	}

	sendAll(cmd, data)
	{
		assert(typeof cmd === "number", `P2p sendAll, cmd should be a Number, now is ${typeof cmd}`);

		for(let i = 0; i < unl.length; i++)
		{
			const connection = connectionsManager.get(Buffer.from(unl[i].address, "hex"));
			if(connection && connection.checkIfCanWrite())
			{
				try
				{
					connection.write(cmd, data);
				}
				catch(e)
				{
					loggerP2p.error(`P2p sendAll, send msg to address: ${connection.address}, host: ${connection.address().address}, port: ${connection.address().port}, ${process[Symbol.for("getStackInfo")](e)}`);
				}
			}
		}
	}

	/**
	 * @param {Buffer} address
	 * @return {Boolean}
	 */
	checkIfConnectionIsOpen(address)
	{
		assert(Buffer.isBuffer(address), `P2p checkIfConnectionIsOpen, address should be an Buffer, now is ${typeof address}`);

		const connection = connectionsManager.get(address);

		if(!connection || connection.checkIfClosed())
		{
			return false;
		}

		return true;
	}

	async reconnectAll()
	{
		for(let i = 0; i < fullUnl.length; i++)
		{
			const node = fullUnl[i];
			const connection = connectionsManager.get(Buffer.from(node.address, "hex"));

			if(!connection || connection.checkIfClosed())
			{
				try
				{
					const connection = await createClient({
						host: node.host,
						port: node.p2pPort,
						dispatcher: this.dispatcher,
						logger: loggerNet,
						address: Buffer.from(node.address, "hex")
					});

					loggerP2p.trace(`P2p reconnectAll, connect to address: ${node.address}, host: ${node.host}, port: ${node.p2pPort}, successed`);
				}
				catch(e)
				{
					loggerP2p.error(`P2p reconnectAll, connect to address: ${node.address}, host: ${node.host}, port: ${node.p2pPort}, ${process[Symbol.for("getStackInfo")](e)}`);
				}
			}	
		}
	}
}


module.exports = P2p;