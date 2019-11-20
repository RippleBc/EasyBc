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
		assert(newConnection instanceof Connection, `ProxyConnectionsManager pushConnection, newConnection should be an instance of Connection, now is ${typeof newConnection}`);

		// add listener
		newConnection.once("connectionClosed", () => {

			this.emit("addressClosed", newConnection.address.toString("hex"));

			// clear
			for (let [index, connection] of this.connections.entries()) {

				if (connection.id.toString('hex') === newConnection.id.toString('hex')) {

					newConnection.logger.info(`ProxyConnectionsManager pushConnection, delete connection, id: ${newConnection.id.toString('hex')}, address: ${newConnection.address.toString("hex")}, url:${newConnection.socket.remoteAddress}:${newConnection.socket.remotePort}`)

					this.connections.splice(index, 1);
				}
			}
		});
		
		// connection with new address
		newConnection.logger.info(`ProxyConnectionsManager pushConnection, new address ${newConnection.address.toString("hex")}, url: ${newConnection.socket.remoteAddress}:${newConnection.socket.remotePort}`);

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