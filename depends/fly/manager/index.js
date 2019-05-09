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

		let i;
		for(i = 0; i < this.connections.length; i++)
		{
			if(this.connections[i].address.toString("hex") === connection.address.toString("hex"))
			{
				break;
			}
		}
		
		if(i === this.connections.length)
		{
			this.connections.push(connection);
			
			connection.logger.trace(`ConnectionsManager push, new address ${connection.address.toString("hex")} has connected`);
		}
		else
		{
			if(this.connections[i].closed === true)
			{
				// del closed connection
				this.connections.splice(i, 1);

				// add new connection
				this.connections.push(connection);

				connection.logger.trace(`ConnectionsManager push, address ${connection.address.toString("hex")} has closed, replace with new connection`);
			}
			else
			{
				connection.close();

				connection.logger.error(`ConnectionsManager push, address ${connection.address.toString("hex")} has connected, close the same connection`);
			}
		}
	}

	/**
	 * @param {Buffer} address
	 */
	get(address)
	{
		assert(Buffer.isBuffer(address), `ConnectionsManager get, address should be an Buffer, now is ${typeof address}`);

		for(let i = 0; i < this.connections.length; i++)
		{
			if(this.connections[i].address.toString("hex") === address.toString("hex"))
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