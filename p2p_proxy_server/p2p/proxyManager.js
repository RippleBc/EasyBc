const Connection = require("../../depends/fly/net/connection");
const assert = require("assert");
const ConnectionsManager = require("../../depends/fly/manager");

const loggerP2p = process[Symbol.for("loggerP2p")];

class ProxyConnectionsManager extends ConnectionsManager {
    constructor() {
        super();
    }

    /**
	 * @param {Connection} newConnection
	 */
	pushConnection(newConnection)
	{
		assert(newConnection instanceof Connection, `ProxyConnectionsManager pushConnection, newConnection should be an instance of Connection, now is ${typeof newConnection}`);

		// add listener
		newConnection.once("connectionClosed", () => {

			// clear
			for (let [index, connection] of this.connections.entries()) {

				if (connection.id.toString('hex') === newConnection.id.toString('hex')) {

					newConnection.logger.warn(`ProxyConnectionsManager pushConnection, delete connection, id: ${newConnection.id.toString('hex')}, host: ${newConnection.host}, port: ${newConnection.port}`)

					this.connections.splice(index, 1);
				}
			}
		});
		
		// connection with new address
        loggerP2p.info(`ProxyConnectionsManager pushConnection, host: ${newConnection.host}, port: ${newConnection.port}`);

		// add new connection
		this.connections.push(newConnection);
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