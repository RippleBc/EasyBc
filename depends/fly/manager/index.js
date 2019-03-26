const Connection = require("../net/connection");
const assert = require("assert");

class Manager
{
	constructor()
	{
		this.connections = []
	}

	push(connection)
	{
		assert(connection instanceof Connection, `Manager push, connection should be an Connection Object, now is ${typeof connection}`);

		this.connections.push(connection)
	}

	get(index)
	{
		assert(typeof index === "number", `Manager get, index should be an Number, now is ${typeof connection}`);

		return this.connection;
	}
}

module.exports = Manager 