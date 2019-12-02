const net = require("net");
const assert = require("assert");
const Connection = require("./net/connection");
const { AUTHORIZE_FAILED_BECAUSE_OF_TIMEOUT, AUTHORIZE_FAILED_BECAUSE_OF_OTHER_INVALID_SIGNATURE, AUTHORIZE_FAILED_BECAUSE_OF_SELF_INVALID_SIGNATURE  } = require("./constant");
const ConnectionsManager = require("./manager");

const CONNECT_TIMEOUT = 5 * 1000;


class Fly {
	constructor({
		dispatcher, 
		auth = true, 
		connectionsManager = new ConnectionsManager(),
		logger = {
			trace: console.info,
			debug: console.info,
			info: console.info,
			warn: console.warn,
			error: console.error,
			fatal: console.error
		}
	}) {
		assert(typeof dispatcher === "function", `Fly constructor, dispatcher should be a function, now is ${typeof dispatcher}`);
		assert(typeof auth === 'boolean', `Fly constructor, auth should be a Boolean, now is ${typeof auth}`);
		assert(connectionsManager instanceof ConnectionsManager, `Fly constructor, connectionsManager should be an instance of ConnectionsManager, now is ${typeof connectionsManager}`);

		this.dispatcher = dispatcher;
		this.auth = auth;
		this.connectionsManager = connectionsManager;
		this.logger = logger;
	}

	/**
	 * @param {String} host 
	 * @param {Number} port
	 * @param {Buffer} privateKey
	 * @return {Connection}
	 */
	async createClient({ host, port, privateKey }) {
		assert(typeof host === 'string', `Fly createClient, host should be a String, now is ${typeof host}`);
		assert(typeof port === 'number', `Fly createClient, port should be a Number, now is ${typeof port}`);
		assert(Buffer.isBuffer(privateKey), `Fly createClient, privateKey should be a Buffer, now is ${typeof privateKey}`);

		const client = net.createConnection({
			allowHalfOpen: true,
			host: host,
			port: port
		});

		// try to connect
		const connection = await new Promise((resolve, reject) => {
			client.on("connect", () => {
				// manage connection
				const connection = new Connection({
					socket: client,
					host: host,
					port: port,
					dispatcher: this.dispatcher,
					logger: this.logger,
					privateKey: privateKey,
					auth: this.auth
				});

				resolve(connection);
			});

			client.on("error", e => {
				reject(`Fly createClient, client connected to host: ${host}, port: ${port}, failed, ${e}`);
			});

			const timeout = setTimeout(() => {
				reject(`Fly createClient, client connected to host: ${host}, port: ${port}, timeout`);
			}, CONNECT_TIMEOUT);

			timeout.unref();
		});

		//
		this.logger.info(`Fly createClient, create an connection to host: ${host}, port: ${port}`);

		//
		if (this.auth) {
			try {
				// try to auth
				await connection.authorize();
			}
			catch (errCode) {
				if (errCode === AUTHORIZE_FAILED_BECAUSE_OF_TIMEOUT) {
					this.logger.error(`Fly createClient, authorize failed because of timeout, host: ${host}, port: ${port}`)

					connection.close();
				}
				else if (errCode === AUTHORIZE_FAILED_BECAUSE_OF_OTHER_INVALID_SIGNATURE) {
					this.logger.error(`Fly createClient, authorize failed because of other invalid signature, me do not trust host: ${host}, port: ${port}`)

					connection.close();
				}
				else if (errCode === AUTHORIZE_FAILED_BECAUSE_OF_SELF_INVALID_SIGNATURE) {
					this.logger.error(`Fly createClient, authorize failed because of invalid signature, host: ${host}, port: ${port} do not trust me`)

					connection.close();
				}
				else {
					this.logger.fatal(`Fly createClient, authorize throw unexpected err, host: ${host}, port: ${port}, ${process[Symbol.for("getStackInfo")](errCode)}`);

					connection.close();
				}

				return;
			}

			this.logger.info(`Fly createClient, authorize successed, host: ${client.host}, port: ${client.port}`);
		}

		// manage success connection
		try {
			this.connectionsManager.pushConnection(connection);
		}
		catch (e) {
			this.logger.fatal(`Fly createClient, connectionsManager.pushConnection throw exception, ${process[Symbol.for("getStackInfo")](e)}`);

			process.exit(1)
		}

		return connection;
	}

	
	/**
	 * @param {String} host
	 * @param {Number} port
	 * @param {Buffer} privateKey
	 * @return {}
	 */
	createServer({ host, port, privateKey }) {
		assert(typeof host === 'string', `Fly createServer, host should be a String, now is ${typeof host}`);
		assert(typeof port === 'number', `Fly createServer, port should be a Number, now is ${typeof port}`);
		assert(Buffer.isBuffer(privateKey), `Fly createServer, privateKey should be a Buffer, now is ${typeof privateKey}`);

		const server = net.createServer({
			allowHalfOpen: true
		});

		server.on("listening", () => {
			this.logger.info(`Fly createServer, host: ${host}, port: ${port}`);
		});

		server.on("connection", socket => {
			// new connection
			const connection = new Connection({
				socket: socket,
				host: socket.remoteAddress,
				port: socket.remotePort,
				dispatcher: this.dispatcher,
				logger: this.logger,
				privateKey: privateKey,
				auth: this.auth
			});

			//
			this.logger.info(`Fly createServer, receive an connection, host: ${socket.remoteAddress}, port: ${socket.remotePort}`);

			//
			if (this.auth) {
				// try to auth
				connection.authorize().then(() => {
					this.logger.info(`Fly createServer, authorize successed, host: ${socket.remoteAddress}, port: ${socket.remotePort}`);

					// manage success connection
					try {
						this.connectionsManager.pushConnection(connection);
					}
					catch (e) {
						this.logger.fatal(`Fly createServer, connectionsManager.pushConnection throw exception, ${process[Symbol.for("getStackInfo")](e)}`);

						process.exit(1)
					}
				}).catch(errCode => {
					if (errCode === AUTHORIZE_FAILED_BECAUSE_OF_TIMEOUT) {
						this.logger.error(`Fly createServer, authorize failed because of timeout, host: ${socket.remoteAddress}, port: ${socket.remotePort}`)

						connection.close();
					}
					else if (errCode === AUTHORIZE_FAILED_BECAUSE_OF_OTHER_INVALID_SIGNATURE) {
						this.logger.error(`Fly createServer, authorize failed because of other invalid signature, me do not trust host: ${socket.remoteAddress}, port: ${socket.remotePort}`)

						connection.close();
					}
					else if (errCode === AUTHORIZE_FAILED_BECAUSE_OF_SELF_INVALID_SIGNATURE) {
						this.logger.error(`Fly createServer, authorize failed because of invalid signature, host: ${socket.remoteAddress}, port: ${socket.remotePort} do not trust me`)

						connection.close();
					}
					else {
						this.logger.fatal(`Fly createServer, authorize throw unexpected err, host: ${socket.remoteAddress}, port: ${socket.remotePort}, ${process[Symbol.for("getStackInfo")](errCode)}`);

						connection.close();
					}
				});
			}
			else
			{
				// manage success connection
				try {
					this.connectionsManager.pushConnection(connection);
				}
				catch (e) {
					this.logger.fatal(`Fly createServer, connectionsManager.pushConnection throw exception, ${process[Symbol.for("getStackInfo")](e)}`);

					process.exit(1);
				}
			}
		});

		server.on("close", () => {
			this.logger.fatal("Fly createServer, server close");

			process.exit(1);
		});

		server.on("error", e => {
			this.logger.error(`Fly createServer, server throw exception, ${process[Symbol.for("getStackInfo")](e)}`);

			server.close();

			this.connectionsManager.closeAll();
		});

		server.listen({
			host: host,
			port: port,
			exclusive: true
		});

		return server;
	}
}

module.exports = Fly;