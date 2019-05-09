const net = require("net");
const assert = require("assert");
const Connection = require("./net/connection");
const ConnectionsManager =require("./manager");

exports.connectionsManager = new ConnectionsManager();

const CONNECT_TIMEOUT = 5 * 1000;

exports.createClient = async function(opts)
{
	const host = opts.host || "localhost";
	const port = opts.port || 8080;
	const logger = opts.logger || {info: console.info, warn: console.warn, error: console.error};

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
				reject(`fly onConnect, client connected on host: ${host}, port: ${port}, address: ${address.toString("hex")} failed, ${e}`);
			});

			const timeout = setTimeout(() => {
				reject(`fly onConnect, client connected on host: ${host}, port: ${port}, address: ${address.toString("hex")} timeout`);
			}, CONNECT_TIMEOUT);

			timeout.unref();
		});

		return promise;
	})();

	logger.trace(`fly createClient, create an connection, address: ${address.toString("hex")}, host: ${host}, port: ${port}`);

	await connection.authorize();

	logger.trace(`fly createClient, authorize successed, address: ${address.toString("hex")}, host: ${host}, port: ${port}`);

	exports.connectionsManager.push(connection);

	return connection;
}

exports.createServer = function(opts)
{
	const host = opts.host || "localhost";
	const port = opts.port || 8080;
	const logger = opts.logger || {info: console.info, warn: console.warn, error: console.error};
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

		const address = socket.address();
		logger.trace(`fly createServer, receive an connection, host: ${address.address}, port: ${address.port}`);

		connection.authorize().then(() => {
			logger.trace(`fly createServer, authorize successed, host: ${address.address}, port: ${address.port}`);
			
			exports.connectionsManager.push(connection);
		}).catch(e => {
			logger.error(`fly createServer, authorize failed, host: ${address.address}, port: ${address.port}, ${e}`)
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