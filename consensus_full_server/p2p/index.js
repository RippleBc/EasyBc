const { tcp } = require("../config.json");
const utils = require("../../depends/utils");
const Fly = require("../../depends/fly");
const assert = require("assert");
const { PROTOCOL_HEART_BEAT } = require("../constants");
const ConnectionsManager = require("./manager");

const Buffer = utils.Buffer;

const loggerP2p = process[Symbol.for("loggerP2p")];
const loggerNet = process[Symbol.for("loggerNet")];
const unlManager = process[Symbol.for("unlManager")];

const CHECK_CONNECT_INTERVAL = 5 * 1000;

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
		
		this.fly = new Fly({
			dispatcher: dispatcher,
			logger: loggerNet,
			connectionsManager: new ConnectionsManager()
		})

		this.fly.connectionsManager.on("addressConnected", address => {
			assert(typeof address === 'string', `addressConnected handler, address shoule be an Array, now is ${typeof address}`)

			if(unlManager.unlNotIncludeSelf.find(node => node.address === address))
			{
				unlManager.setNodesOnline([address])
			}
			
		});

		this.fly.connectionsManager.on("addressClosed", address => {

			assert(typeof address === 'string', `addressClosed handler, address shoule be an Array, now is ${typeof address}`)

			if(unlManager.unlNotIncludeSelf.find(node => node.address === address))
			{
				unlManager.setNodesOffline([address])
			}
		});
	}

	async init()
	{
		const unlNotIncludeSelf = unlManager.unlNotIncludeSelf;

		// init server
		const server = await this.fly.createServer({
			host: tcp.host,
			port: tcp.port,
			privateKey: process[Symbol.for("privateKey")]
		});

		// init conn
		for(let i = 0; i < unlNotIncludeSelf.length; i++)
		{
			const node = unlNotIncludeSelf[i];

			try
			{
				const connection = await this.fly.createClient({
					host: node.host,
					port: node.p2pPort,
					privateKey: process[Symbol.for("privateKey")]
				});

				if (connection.address.toString('hex') !== node.address)
				{
					connection.close();
				}
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
			// try to reconnect other nodes
			this.reconnectAll();

			// broadcast  heartbeat
			this.sendAll(PROTOCOL_HEART_BEAT)
		}, CHECK_CONNECT_INTERVAL);
	}

	send(address, cmd, data)
	{
		assert(typeof cmd === "number", `P2p send, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(address), `P2p send, data should be an Buffer, now is ${typeof address}`);
		
		const connection = this.fly.connectionsManager.get(address);
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

		const unlOnline = unlManager.unlOnline;
		
		for(let i = 0; i < unlOnline.length; i++)
		{
			const connection = this.fly.connectionsManager.get(Buffer.from(unlOnline[i].address, "hex"));
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

	async reconnectAll()
	{
		const unlNotIncludeSelf = unlManager.unlNotIncludeSelf;

		for(let i = 0; i < unlNotIncludeSelf.length; i++)
		{
			const node = unlNotIncludeSelf[i];
			const connection = this.fly.connectionsManager.get(Buffer.from(node.address, "hex"));

			if(!connection || connection.checkIfClosed())
			{
				try
				{
					const connection = await this.fly.createClient({
						host: node.host,
						port: node.p2pPort,
						privateKey: process[Symbol.for("privateKey")]
					});

					if (connection.address.toString('hex') !== node.address)
					{
						connection.close();
					}
					else
					{
						loggerP2p.info(`P2p reconnectAll, connect to address: ${node.address}, host: ${node.host}, port: ${node.p2pPort}, successed`);
				
					}
				}
				catch(e)
				{
					// 
					unlManager.setNodesOffline([node.address])

					loggerP2p.error(`P2p reconnectAll, connect to address: ${node.address}, host: ${node.host}, port: ${node.p2pPort}, ${process[Symbol.for("getStackInfo")](e)}`);
				}
			}
		}
	}
}


module.exports = P2p;