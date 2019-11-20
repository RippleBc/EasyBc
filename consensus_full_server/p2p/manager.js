const Connection = require("../../depends/fly/net/connection");
const assert = require("assert");
const ConnectionsManagerBase = require("../../depends/fly/manager");

class ConnectionsManager extends ConnectionsManagerBase {
    constructor() {
        super();

        this.connections = [];
    }

	/**
	 * @param {Connection} connection
	 */
    push(connection) {
        assert(connection instanceof Connection, `ConnectionsManager push, connection should be an Connection Object, now is ${typeof connection}`);

        let i;
        for (i = 0; i < this.connections.length; i++) {
            if (this.connections[i].address.toString("hex") === connection.address.toString("hex")) {
                break;
            }
        }

        if (i === this.connections.length) {
            // add new connection
            this.connections.push(connection);

            connection.logger.info(`ConnectionsManager push, new address ${connection.address.toString("hex")}, url: ${connection.socket.remoteAddress}:${connection.socket.remotePort}`);

            this.emit("addressConnected", connection.address.toString("hex"));

            connection.once("connectionClosed", () => {

                this.emit("addressClosed", connection.address.toString("hex"));

                // delete
                for (let i = 0; i < this.connections.length; i++) {
                    const ele = this.connections[i];

                    if (ele.id === connection.id
                        && ele.address.toString("hex") === connection.address.toString("hex")
                        && ele.socket.remoteAddress === connection.socket.remoteAddress
                        && ele.socket.remotePort === connection.socket.remotePort
                        && ele.checkIfClosed()) {

                        connection.logger.info(`ConnectionsManager delete connection from this.connections, id: ${connection.id}, address: ${connection.address.toString("hex")}, url:${connection.socket.remoteAddress}:${connection.socket.remotePort}`)

                        this.connections.splice(i, 1);

                        break;
                    }
                }
            })
        }
        else {
            if (this.connections[i].checkIfClosed()) {
                // delete connectionClosed event listeners
                this.connections[i].removeAllListeners("connectionClosed")

                connection.logger.info(`ConnectionsManager push, address ${this.connections[i].address.toString("hex")}, url: ${this.connections[i].socket.remoteAddress}:${this.connections[i].socket.remotePort} has closed, replace with new connection, url: ${connection.socket.remoteAddress}:${connection.socket.remotePort}`);

                // replace closed collection
                this.connections[i] = connection

                this.emit("addressConnected", connection.address.toString("hex"))

                connection.once("connectionClosed", () => {

                    this.emit("addressClosed", connection.address.toString("hex"))

                    // delete
                    for (let i = 0; i < this.connections.length; i++) {
                        const ele = this.connections[i];

                        if (ele.id === connection.id
                            && ele.address.toString("hex") === connection.address.toString("hex")
                            && ele.socket.remoteAddress === connection.socket.remoteAddress
                            && ele.socket.remotePort === connection.socket.remotePort
                            && ele.checkIfClosed()) {

                            connection.logger.info(`ConnectionsManager delete connection from this.connections, id: ${connection.id}, address: ${connection.address.toString("hex")}, url:${connection.socket.remoteAddress}:${connection.socket.remotePort}`)

                            this.connections.splice(i, 1);

                            break;
                        }
                    }
                })
            }
            else {
                this.connections[i].logger.error(`ConnectionsManager push, address ${connection.address.toString("hex")} has connected, close the same connection`);

                connection.close();
            }
        }
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

    closeAll() {
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].logger.warn(`ConnectionsManager closeAll, address ${this.connections[i].address.toString('hex')}`)

            this.emit("addressClosed", this.connections[i].address.toString("hex"))

            // delete connectionClosed event listeners
            this.connections[i].removeAllListeners("connectionClosed")

            this.connections[i].close();
        }

        this.connections = [];
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