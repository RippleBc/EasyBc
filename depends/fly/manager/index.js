const Connection = require("../net/connection");
const assert = require("assert");

class ConnectionsManager
{
	constructor()
	{
		this.connections = [];
	}

	/**
	 * @param {Connection} connection
	 */
	push(connection)
	{
		assert(connection instanceof Connection, `ConnectionsManager push, connection should be an Connection Object, now is ${typeof connection}`);

		this.connections.push(connection)
	}

	/**
	 * @param {String} address
	 */
	get(address)
	{
		assert(typeof index === "string", `ConnectionsManager get, index should be an String, now is ${typeof connection}`);

		for(let i = 0; i < this.connections.length; i++)
		{
			if(this.connections[i].address === address)
			{
				return this.connections[i];
			}
		}

		return undefined;
	}

	getAll()
	{
		return this.connections;
	}

	/**
	 * @param {String} address
	 */
	close(address)
	{
		assert(typeof index === "string", `ConnectionsManager close, index should be an String, now is ${typeof connection}`);

		for(let i = 0; i < this.connections.length; i++)
		{
			if(this.connections[i].address === address)
			{
				this.connections[i].close();
			}
		}
	}

	closeAll()
	{
		for(let i = 0; i < this.connections.length; i++)
		{
			this.connections[i].close();
		}
	}
}

module.exports = ConnectionsManager; 