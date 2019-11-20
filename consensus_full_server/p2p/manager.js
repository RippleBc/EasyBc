const Connection = require("../../depends/fly/net/connection");
const assert = require("assert");
const ConnectionsManagerBase = require("../../depends/fly/manager");

class ConnectionsManager extends ConnectionsManagerBase {
    constructor() {
        super();
    }

	/**
	 * @param {Buffer} address
	 */
    get(address) {
        assert(Buffer.isBuffer(address), `ConnectionsManager get, address should be an Buffer, now is ${typeof address}`);

        for (let i = 0; i < this.connections.length; i++) {
            if (this.connections[i].address.toString("hex") === address.toString("hex")) {
                return this.connections[i];
            }
        }

        return undefined;
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

module.exports = ConnectionsManager; 