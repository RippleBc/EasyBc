const Connection = require("../../depends/fly/net/connection");
const assert = require("assert");
const ConnectionsManager = require("../../depends/fly/manager");
const unlManager = process[Symbol.for("unlManager")];

const loggerP2p = process[Symbol.for("loggerP2p")];

class AuthConnectionsManager extends ConnectionsManager {
    constructor() {
        super();
    }

	/**
	 * @param {Buffer} address
	 */
    get(address) {
        assert(Buffer.isBuffer(address), `AuthConnectionsManager get, address should be an Buffer, now is ${typeof address}`);

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
    pushConnection(newConnection) {
        if (unlManager.unlNotIncludeSelf.find(node => node.address === newConnection.address.toString('hex'))) {
            super.pushConnection(newConnection);

            return;
        }

        loggerP2p.error(`AuthConnectionsManager pushConnection, invalid address ${newConnection.address.toString('hex')}`)
        
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

module.exports = AuthConnectionsManager; 