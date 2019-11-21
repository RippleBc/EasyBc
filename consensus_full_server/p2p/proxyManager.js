const Connection = require("../../depends/fly/net/connection");
const assert = require("assert");
const ConnectionsManager = require("../../depends/fly/manager");

const unlManager = process[Symbol.for("unlManager")];
const loggerP2p = process[Symbol.for("loggerP2p")];

class ProxyConnectionsManager extends ConnectionsManager {
    constructor() {
        super();
    }

	/**
	 * @param {Buffer} address
	 */
    get(address) {
        assert(Buffer.isBuffer(address), `ProxyConnectionsManager get, address should be an Buffer, now is ${typeof address}`);

        // find correspond node by address
        const node = unlManager.unlNotIncludeSelf.find(node => node.address === address.toString('hex'));

        // find correspond conn by host and port
        for (let connection of this.connections) {
            if (connection.host === node.host
                && connection.port === node.p2pPort) {
                return connection;
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

			// clear
			for (let [index, connection] of this.connections.entries()) {

				if (connection.id.toString('hex') === newConnection.id.toString('hex')) {

					newConnection.logger.warn(`ProxyConnectionsManager pushConnection, delete connection, id: ${newConnection.id.toString('hex')}, host: ${newConnection.host}, port: ${newConnection.port}`);

					this.connections.splice(index, 1);
				}
			}
		});
		
		// connection with new address
        loggerP2p.info(`ProxyConnectionsManager pushConnection, url: ${newConnection.host}:${newConnection.port}`);

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