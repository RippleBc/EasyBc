const net = require("net");
const assert = require("assert");
const Connection = require("./net/connection");
const ConnectionsManager =require("./manager");
const { AUTHORIZE_FAILED_BECAUSE_OF_TIMEOUT, AUTHORIZE_FAILED_BECAUSE_OF_INVALID_SIGNATURE } = require("./constant");

exports.connectionsManager = new ConnectionsManager();

const CONNECT_TIMEOUT = 5 * 1000;

exports.createClient = async function(opts)
{
	const host = opts.host || "localhost";
	const port = opts.port || 8080;
	const logger = opts.logger || { trace: console.info, debug: console.info, info: console.info, warn: console.warn, error: console.error, fatal: console.error };

	const address = opts.address;
	const dispatcher = opts.dispatcher;

	assert(Buffer.isBuffer(address), `fly createClient, address should be an Buffer, now is ${typeof address}`);
	assert(typeof dispatcher === "function", `fly createServer, dispatcher should be a function, now is ${typeof dispatcher}`);

	const client = net.createConnection({ 
		host: host,
	  port: port
	});

	const connection = await (async function() {
		const promise = new Promise((resolve, reject) => {
			client.on("connect", () => {
				// manage connection
				const connection = new Connection({
					socket: client,
					dispatcher: dispatcher,
					address: address,
					logger: logger
				});

				resolve(connection);
			});

			client.on("error", e => {
				reject(`fly onConnect, client connected to address: ${address.toString("hex")}, host: ${client.remoteAddress}, port: ${client.remotePort}, failed, ${e}`);
			});

			const timeout = setTimeout(() => {
				reject(`fly onConnect, client connected to address: ${address.toString("hex")}, host: ${client.remoteAddress}, port: ${client.remotePort}, timeout`);
			}, CONNECT_TIMEOUT);

			timeout.unref();
		});

		return promise;
	})();

	logger.trace(`fly createClient, create an connection to address: ${address.toString("hex")}, host: ${client.remoteAddress}, port: ${client.remotePort}`);

	await connection.authorize();

	logger.trace(`fly createClient, authorize successed to address: ${address.toString("hex")}, host: ${client.remoteAddress}, port: ${client.remotePort}`);

	exports.connectionsManager.push(connection);

	return connection;
}

exports.createServer = function(opts)
{
	const host = opts.host || "localhost";
	const port = opts.port || 8080;
	const logger = opts.logger || { trace: console.info, debug: console.info, info: console.info, warn: console.warn, error: console.error, fatal: console.error };
	const dispatcher = opts.dispatcher;

	assert(typeof dispatcher === "function", `fly createServer, dispatcher should be a function, now is ${typeof dispatcher}`);

	const server = net.createServer();

	server.on("listening", () => {
		logger.trace(`fly createServer, host: ${host}, port: ${port}`);
	});

	server.on("connection", socket => {
		// manage connection
		const connection = new Connection({
			socket: socket,
			dispatcher: dispatcher,
			logger: logger
		});

		logger.info(`fly createServer, receive an connection, host: ${socket.remoteAddress}, port: ${socket.remotePort}`);

		connection.authorize().then(() => {
			logger.info(`fly createServer, authorize successed, host: ${socket.remoteAddress}, port: ${socket.remotePort}`);
			
			exports.connectionsManager.push(connection);
		}).catch(errCode => {
			if(errCode === AUTHORIZE_FAILED_BECAUSE_OF_TIMEOUT)
			{
				logger.error(`fly createServer, authorize failed because of timeout, host: ${socket.remoteAddress}, port: ${socket.remotePort}`)

				connection.close();
			}
			else if(errCode === AUTHORIZE_FAILED_BECAUSE_OF_INVALID_SIGNATURE)
			{
				logger.error(`fly createServer, authorize failed because of invalid signature, host: ${socket.remoteAddress}, port: ${socket.remotePort}`)

				connection.close();
			}
			else
			{
				logger.fatal(`fly createServer, authorize throw unexpected err, ${errCode}`);

				connection.close();
			}
		});
	});

	server.on("close", () => {
		logger.trace("fly createServer, server close");
	});

	server.on("error", e => {
		logger.error(`fly createServer, server throw exception, ${e}`);

		server.close();

		exports.connectionsManager.closeAll();
	});

	server.listen({
		host: host,
	  port: port,
	  exclusive: true
	});

	return server;
}