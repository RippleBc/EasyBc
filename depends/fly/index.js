const net = require("net");
const assert = require("assert");
const Connection = require("./net/connection");
const ConnectionManager =require("./manager");

exports.connectionManager = new ConnectionManager();


const onConnect = async function(client, dispatcher)
{
	const promise = new Promise((resolve, reject) => {
		client.on("connect", () => {
			// manage connection
			const connection = new Connection({
				socket: client,
				dispatcher: dispatcher
			});
			exports.connectionManager.push(connection);

			resolve(connection);
		});
	});

	return promise;
}

exports.createClient = async function(opts)
{
	const host = opts.host || "localhost";
	const port = opts.port || 8080;
	const logger = opts.logger || {info: console.info, warn: console.warn, err: console.err};
	const dispatcher = opts.dispatcher;

	assert(typeof dispatcher === "function", `fly createServer, dispatcher should be a function, now is ${typeof dispatcher}`);

	const client = net.createConnection({ 
		host: host,
	  port: port
	});

	const connection = await onConnect(client, dispatcher);

	// info
	const address = client.address();
	logger.info(`client connected on port: ${address.port}, family: ${address.family}, address: ${address.address}`);

	return connection;
}

exports.createServer = function(opts)
{
	const host = opts.host || "localhost";
	const port = opts.port || 8080;
	const logger = opts.logger || {info: console.info, warn: console.warn, err: console.err};
	const dispatcher = opts.dispatcher;

	assert(typeof dispatcher === "function", `fly createServer, dispatcher should be a function, now is ${typeof dispatcher}`);

	const server = net.createServer();

	server.on("listening", () => {
		logger.info("opened server on", server.address());
	});

	server.on("connection", socket => {
		// manage connection
		const connection = new Connection({
			socket: socket,
			dispatcher: dispatcher
		});
		exports.connectionManager.push(connection);

		// info
		const address = socket.address();
		logger.info(`receive an connection port: ${address.port}, family: ${address.family}, address: ${address.address}`);
	});

	server.on("close", () => {
		logger.info("server close success");
	});

	server.on("error", err => {
		logger.error(`server throw exception, ${err}`);

		server.close();
		exports.connectionManager.closeAll();
	});

	server.listen({
		host: host,
	  port: port,
	  exclusive: true
	});

	return server;
}