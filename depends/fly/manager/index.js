const Connection = require("../net/connection");
const assert = require("assert");
const AsyncEventEmitter = require("async-eventemitter");

class ConnectionsManager extends AsyncEventEmitter
{
	constructor()
	{
		super();

		this.connections = [];
	}

	/**
	 * @param {Connection} newConnection
	 */
	pushConnection(newConnection)
	{
		assert(newConnection instanceof Connection, `ConnectionsManager pushConnection, newConnection should be an instance of Connection, now is ${typeof newConnection}`);

		// add listener
		newConnection.once("connectionClosed", () => {

			this.emit("addressClosed", newConnection.address.toString("hex"));

			// clear
			for (let [index, connection] of this.connections.entries()) {

				if (connection.id.toString('hex') === newConnection.id.toString('hex')) {

					newConnection.logger.info(`ConnectionsManager pushConnection, delete connection, id: ${newConnection.id.toString('hex')}, address: ${newConnection.address.toString("hex")}, url:${newConnection.socket.remoteAddress}:${newConnection.socket.remotePort}`)

					this.connections.splice(index, 1);
				}
			}
		});

		// 
		for(let [index, connection] of this.connections.entries())
		{
			if (connection.address.toString("hex") !== newConnection.address.toString("hex"))
			{
				continue;
			}

			if (connection.checkIfClosed()) {
				connection.logger.info(`ConnectionsManager pushConnection, address ${newConnection.address.toString("hex")}, url: ${newConnection.socket.remoteAddress}:${newConnection.socket.remotePort} has closed, replace with new connection, url: ${newConnection.socket.remoteAddress}:${newConnection.socket.remotePort}`);

				// replace closed collection
				this.connection[index] = newConnection;

				this.emit("addressConnected", newConnection.address.toString("hex"));
			}
			else {
				newConnection.logger.error(`ConnectionsManager pushConnection, address ${newConnection.address.toString("hex")} has connected, close the same connection`);

				newConnection.removeAllListeners("connectionClosed");

				newConnection.close();
			}

			return;
		}
		
		// connection with new address
		newConnection.logger.info(`ConnectionsManager pushConnection, new address ${newConnection.address.toString("hex")}, url: ${newConnection.socket.remoteAddress}:${newConnection.socket.remotePort}`);

		// add new connection
		this.connections.push(newConnection);
		
		this.emit("addressConnected", newConnection.address.toString("hex"));

		
	}

	closeAll()
	{
		for(let connnection of this.connections.entries())
		{
			connnection.logger.warn(`ConnectionsManager closeAll, address ${connnection.address.toString('hex')}`);

			this.emit("addressClosed", connnection.address.toString("hex"));

			connnection.close();
		}

		this.connections = [];
	}
}

module.exports = ConnectionsManager; 