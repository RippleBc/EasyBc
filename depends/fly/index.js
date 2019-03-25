const net = require("net");
const assert = require("assert");

module.exports.createClient = function(opts)
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

	client.on("connect", () => {
		const address = client.address();
		logger.info(`client connected on port: ${address.port}, family: ${address.family}, address: ${address.address}`);
	});
}

module.exports.createServer = function(opts)
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

	server.on("connection", connection => {
		const address = connection.address();
		logger.info(`receive an connection port: ${address.port}, family: ${address.family}, address: ${address.address}`);
	});

	server.on("error", (err) => {
		throw Error(`server err, ${err}`);
	});

	server.listen({
		host: host,
	  port: port,
	  exclusive: true
	});

}