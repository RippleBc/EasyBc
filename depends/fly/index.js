const net = require("net");
const assert = require("assert");
const Connection = require("./net/connection");
const ConnectionManager =require("./manager");

exports.connectionManager = new ConnectionManager();

const CONNECT_TIMEOUT = 5 * 1000;

const onConnect = async function(client, dispatcher, address, host, port)
{
	const promise = new Promise((resolve, reject) => {
		client.on("connect", () => {
			// manage connection
			const connection = new Connection({
				socket: client,
				dispatcher: dispatcher,
				address: address
			});

			resolve(connection);
		});

		client.on("error", e => {
			reject(`client connected on host: ${host}, port: ${port}, address: ${client.address().address} failed, ${e}`);
		});

		const timeout = setTimeout(() => {
			reject(`client connected on host: ${host}, port: ${port}, address: ${client.address().address} timeout`);
		}, CONNECT_TIMEOUT);
		timeout.unref();
	});

	return promise;
}

exports.createClient = async function(opts)
{
	const host = opts.host || "localhost";
	const port = opts.port || 8080;
	const logger = opts.logger || {info: console.info, warn: console.warn, err: console.err};

	const address = opts.address;
	const dispatcher = opts.dispatcher;

	assert(Buffer.isBuffer(address), `fly createClient, address should be an Buffer, now is ${typeof address}`);
	assert(typeof dispatcher === "function", `fly createServer, dispatcher should be a function, now is ${typeof dispatcher}`);

	const client = net.createConnection({ 
		host: host,
	  port: port
	});

	const connection = await onConnect(client, dispatcher, address, host, port);

	try
	{
		await connection.authorize();
	}
	catch(e)
	{
		return Promise.reject(`authorize is failed, client connected on port: ${client.address().port}, family: ${client.address().family}, address: ${client.address().address}, ${e}`);
	}

	exports.connectionManager.push(connection);

	// info
	logger.info(`authorize successed, client connected on port: ${client.address().port}, family: ${client.address().family}, address: ${client.address().address}`);

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
		logger.info("opened server on", server.address());
	});

	server.on("connection", socket => {
		// manage connection
		const connection = new Connection({
			socket: socket,
			dispatcher: dispatcher
		});

		connection.authorize().then(() => {
			exports.connectionManager.push(connection);

			// info
			const address = socket.address();
			logger.info(`authorize successed, receive an connection port: ${address.port}, family: ${address.family}, address: ${address.address}`);
		}).catch(e => {
			logger.error(`authorize failed, receive an connection port: ${address.port}, family: ${address.family}, address: ${address.address}, ${e}`)
		});
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