const utils = require("../../depends/utils");
const Fly = require("../../depends/fly");
const assert = require("assert");
const { PROTOCOL_HEART_BEAT } = require("../../consensus_full_server/constants");
const ProxyConnectionsManager = require("./proxyManager");
const { p2pProxy } = require("../../globalConfig.json");
const {
	host: fullConsensusHost,
	port: fullConsensusPort
} = require("../../consensus_full_server/config").tcp

const loggerP2p = process[Symbol.for("loggerP2p")];
const loggerNet = process[Symbol.for("loggerNet")];

const CHECK_CONNECT_INTERVAL = 5 * 1000;

class P2p
{
	/**
	 * @param {Function} dispatcher
	 */
	constructor(dispatcher)
	{
		assert(typeof dispatcher === "function", `P2p constructor, dispatcher should be a Function, now is ${typeof dispatcher}`)
		assert(typeof p2pProxy.host === "string", `P2p constructor, p2pProxy.host should be a String, now is ${typeof p2pProxy.host}`);
		assert(typeof p2pProxy.port === "number", `P2p constructor, p2pProxy.port should be a Number, now is ${typeof p2pProxy.port}`);

		this.connectionsManager = new ProxyConnectionsManager();

		this.fly = new Fly({
			dispatcher: dispatcher,
			logger: loggerNet,
			connectionsManager: this.connectionsManager,
			auth: false
		})
	}

	async init()
	{
		// init server
		await this.fly.createServer({
			host: p2pProxy.host,
			port: p2pProxy.port,
			privateKey: process[Symbol.for("privateKey")]
		});

		// connect to full server
		try{
			this.fullServerConnection = await this.fly.createClient({
				host: fullConsensusHost,
				port: fullConsensusPort,
				privateKey: process[Symbol.for("privateKey")]
			});
		}
		catch(e)
		{
			loggerP2p.error(`P2p init, connect to host: ${fullConsensusHost}, port: ${fullConsensusPort}, ${process[Symbol.for("getStackInfo")](e)}`);
		}

		// check connection
		setInterval(() => {
			// 
			if (!this.fullServerConnection || this.fullServerConnection.checkIfClosed())
			{
				this.fly.createClient({
					host: fullConsensusHost,
					port: fullConsensusPort,
					privateKey: process[Symbol.for("privateKey")]
				}).then(conn => {
					this.fullServerConnection = conn;
				}).catch(e => {
					loggerP2p.error(`P2p reconnectAll, connect to host: ${fullConsensusHost}, port: ${fullConsensusPort}, ${process[Symbol.for("getStackInfo")](e)}`);
				});
			}

			// broadcast  heartbeat
			this.send(PROTOCOL_HEART_BEAT)
		}, CHECK_CONNECT_INTERVAL);
	}

	/**
	 * @param {Number} cmd 
	 * @param {*} data 
	 */
	send(cmd, data)
	{
		assert(typeof cmd === "number", `P2p send, cmd should be a Number, now is ${typeof cmd}`);
		
		if(this.fullServerConnection && this.fullServerConnection.checkIfCanWrite())
		{
			try
			{
				this.fullServerConnection.write(cmd, data);
			}
			catch(e)
			{
				loggerP2p.error(`P2p send, send msg to host: ${connection.host}, port: ${connection.port}, ${process[Symbol.for("getStackInfo")](e)}`);
			}
		}
	}
}


module.exports = P2p;