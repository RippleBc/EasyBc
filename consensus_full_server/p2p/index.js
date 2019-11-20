const { tcp } = require("../config.json");
const utils = require("../../depends/utils");
const Fly = require("../../depends/fly");
const assert = require("assert");
const { PROTOCOL_HEART_BEAT } = require("../constants");
const AuthConnectionsManager = require("./authManager");
const ProxyConnectionsManager = require("./proxyManager");
const { p2pProxy } = require("../../globalConfig.json");

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

		if(p2pProxy.open)
		{
			this.connectionsManager = new ProxyConnectionsManager();

			this.auth = false;
		}
		else
		{
			this.connectionsManager = new AuthConnectionsManager();

			this.auth = true;
		}

		this.fly = new Fly({
			dispatcher: dispatcher,
			logger: loggerNet,
			connectionsManager: this.connectionsManager,
			auth: this.auth
		})

		if(this.auth)
		{
			this.connectionsManager.on("addressConnected", address => {
				assert(typeof address === 'string', `addressConnected handler, address shoule be an Array, now is ${typeof address}`)

				if (unlManager.unlNotIncludeSelf.find(node => node.address === address)) {
					unlManager.setNodesOnline([address])
				}

			});

			this.connectionsManager.on("addressClosed", address => {

				assert(typeof address === 'string', `addressClosed handler, address shoule be an Array, now is ${typeof address}`)

				if (unlManager.unlNotIncludeSelf.find(node => node.address === address)) {
					unlManager.setNodesOffline([address])
				}
			});
		}
		
	}

	async init()
	{
		const unlNotIncludeSelf = unlManager.unlNotIncludeSelf;

		// init server
		await this.fly.createServer({
			host: tcp.host,
			port: tcp.port,
			privateKey: process[Symbol.for("privateKey")]
		});

		// init conn
		for(let node of unlNotIncludeSelf)
		{
			try
			{
				await this.fly.createClient({
					host: node.host,
					port: node.p2pPort,
					privateKey: process[Symbol.for("privateKey")]
				});
			}
			catch(e)
			{
				// 
				if(this.auth)
				{
					unlManager.setNodesOffline([node.address])
				}

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

	/**
	 * @param {Buffer} address 
	 * @param {Number} cmd 
	 * @param {*} data 
	 */
	send(address, cmd, data)
	{
		assert(typeof cmd === "number", `P2p send, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(address), `P2p send, data should be an Buffer, now is ${typeof address}`);

		const connection = this.connectionsManager.get(address);
		if(connection && connection.checkIfCanWrite())
		{
			try
			{
				connection.write(cmd, data);
			}
			catch(e)
			{
				loggerP2p.error(`P2p send, send msg to address: ${connection.address}, host: ${connection.host}, port: ${connection.port}, ${process[Symbol.for("getStackInfo")](e)}`);
			}
		}
	}

	/**
	 * @param {Number} cmd 
	 * @param {*} data 
	 */
	sendAll(cmd, data)
	{
		assert(typeof cmd === "number", `P2p sendAll, cmd should be a Number, now is ${typeof cmd}`);
		
		for (let node of unlManager.unlOnline)
		{
			const connection = this.connectionsManager.get(Buffer.from(node.address, "hex"));
			if(connection && connection.checkIfCanWrite())
			{
				try
				{
					connection.write(cmd, data);
				}
				catch(e)
				{
					loggerP2p.error(`P2p sendAll, send msg to address: ${connection.address}, host: ${connection.host}, port: ${connection.port}, ${process[Symbol.for("getStackInfo")](e)}`);
				}
			}
		}
	}

	async reconnectAll()
	{
		for (let node of unlManager.unlNotIncludeSelf)
		{
			const connection = this.connectionsManager.get(Buffer.from(node.address, "hex"));

			if(!connection || connection.checkIfClosed())
			{
				try
				{
					await this.fly.createClient({
						host: node.host,
						port: node.p2pPort,
						privateKey: process[Symbol.for("privateKey")]
					});

					loggerP2p.info(`P2p reconnectAll, connect to address: ${node.address}, host: ${node.host}, port: ${node.p2pPort}, successed`);
				
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