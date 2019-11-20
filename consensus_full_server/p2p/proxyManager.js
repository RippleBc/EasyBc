const Connection = require("../../depends/fly/net/connection");
const assert = require("assert");
const ConnectionsManager = require("../../depends/fly/manager");

class ProxyConnectionsManager extends ConnectionsManager {
    constructor() {
        super();
    }

	/**
	 * @param {Buffer} address
	 */
    get(address) {
        assert(Buffer.isBuffer(address), `ProxyConnectionsManager get, address should be an Buffer, now is ${typeof address}`);

        for (let i = 0; i < this.connections.length; i++) {
            if (this.connections[i].address.toString("hex") === address.toString("hex")) {
                return this.connections[i];
            }
        }

        return undefined;
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
    
	/**
	 * @return {Array}
	 */
    getAllConnections() {
        const connectionsInfo = [];

        for (let connection of this.connections) {
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

module.exports = ProxyConnectionsManager; 