const Connection = require("../net/connection");
const assert = require("assert");
const AsyncEventEmitter = require("async-eventemitter");

class ConnectionsManager extends AsyncEventEmitter
{
	constructor()
	{
		super();

		this.connections = [];
		this.allConnections = []
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
			// add new connection
			this.connections.push(connection);
			
			connection.logger.info(`ConnectionsManager push, new address ${connection.address.toString("hex")}, url: ${connection.socket.remoteAddress}:${connection.socket.remotePort}`);

			this.emit("addressConnected", connection.address.toString("hex"));

			connection.once("connectionClosed", () => {

				this.emit("addressClosed", connection.address.toString("hex"));

				this.connections.splice(i, 1);
			})
		}
		else
		{
			if(this.connections[i].checkIfClosed())
			{
				// delete connectionClosed event listeners
				this.connections[i].removeAllListeners("connectionClosed")

				connection.logger.info(`ConnectionsManager push, address ${connections[i].address.toString("hex")}, url: ${connections[i].socket.remoteAddress}:${connections[i].socket.remotePort} has closed, replace with new connection, url: ${connection.socket.remoteAddress}:${connection.socket.remotePort}`);

				// replace closed collection
				this.connections[i] = connection
				
				this.emit("addressConnected", connection.address.toString("hex"))

				connection.once("connectionClosed", () => {

					this.emit("addressClosed", connection.address.toString("hex"))

					this.connections.splice(i, 1);
				})
			}
			else
			{
				this.connections[i].logger.error(`ConnectionsManager push, address ${connection.address.toString("hex")} has connected, close the same connection`);

				connection.close();
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
		assert(typeof address === "string", `ConnectionsManager close, address should be an String, now is ${typeof address}`);

		for(let i = 0; i < this.connections.length; i++)
		{
			if(this.connections[i].address.toString("hex") === address)
			{
				this.connections[i].logger.warn(`ConnectionsManager close, address ${address}`)

				this.emit("addressClosed", address)

				// delete connectionClosed event listeners
				this.connections[i].removeAllListeners("connectionClosed")

				this.connections[i].close();

				this.connections.splice(i, 1);

				break;
			}
		}
	}

	closeAll()
	{
		for(let i = 0; i < this.connections.length; i++)
		{
			this.connections[i].logger.warn(`ConnectionsManager closeAll, address ${this.connections[i].address.toString('hex')}`)

			this.emit("addressClosed", this.connections[i].address.toString("hex"))

			// delete connectionClosed event listeners
			this.connections[i].removeAllListeners("connectionClosed")

			this.connections[i].close();
		}

		this.connections = [];
	}

	/**
	 * @param {Array/String} addresses - connection addresses should be keeped
	 */
	clearInvalidConnections(addresses)
	{
		assert(Array.isArray(addresses), `ConnectionManager clearInvalidConnections, addresses should be an Array, now is ${typeof addresses}`)
		
		const originConnections = this.connections;
		this.connections = []

		for(let i = 0; i < originConnections.length; i++)
		{
			if(undefined !== addresses.find(address => address === originConnections[i].address.toString("hex")))
			{
				this.connections.push(originConnections[i]);
			}
			else
			{
				this.emit("addressClosed", originConnections[i].address.toString("hex"))

				originConnections[i].removeAllListeners("connectionClosed");

				originConnections[i].close();

				originConnections[i].logger.warn(`ConnectionManager clearInvalidConnections, close address ${originConnections[i].address.toString("hex")}`)
			}
		}
	}

	/**
	 * @param {Connection} connection
	 */
	pushToAllConnections(connection) 
	{
		assert(connection instanceof Connection, `ConnectionsManager pushToAllConnections, connection should be an Connection Object, now is ${typeof connection}`);

		this.allConnections.push(connection)
	}

	/**
	 * @return {Array}
	 */
	getAllConnections()
	{
		const connectionsInfo = [];

		for(let connection of this.allConnections)
		{
			connectionsInfo.push({
				address: connection.address ? connection.address.toString("hex") : 'undefined',
				url: connection.socket ? `${connection.socket.remoteAddress}:${connection.socket.remotePort}` : 'undefined',
				readChannelClosed: connection.readChannelClosed,
				writeChannelClosed: connection.writeChannelClosed,
				allChannelClosed: connection.allChannelClosed,
				stopWriteToBuffer: connection.stopWriteToBuffer,
				ifAuthorizeSuccess: connection.ifAuthorizeSuccess
			});
		}

		return connectionsInfo;
	}
}

module.exports = ConnectionsManager; 