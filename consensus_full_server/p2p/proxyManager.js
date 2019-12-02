const Connection = require("../../depends/fly/net/connection");
const assert = require("assert");
const ConnectionsManager = require("../../depends/fly/manager");
const { PROTOCOL_HEART_BEAT } = require("../constants");

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
        if(!node)
        {
            loggerP2p.error(`ProxyConnectionsManager get, address ${address.toString('hex')} is invalid`);

            return;
        }

        // find correspond conn by host and port
        for (let connection of this.connections) {
            if (connection.host === node.host
                && connection.port === node.p2pPort) {
                return connection;
            }
        }

        return;
    }

    /**
	 * @param {Connection} newConnection
	 */
	pushConnection(newConnection)
	{
		assert(newConnection instanceof Connection, `ProxyConnectionsManager pushConnection, newConnection should be an instance of Connection, now is ${typeof newConnection}`);

		// add listener
		newConnection.once("connectionClosed", () => {

            //
            const node = unlManager.unlNotIncludeSelf.find(node => node.host === newConnection.host && node.port === newConnection.port);
            if (node) {
                this.emit("addressClosed", node.address);
            }

			// clear
			for (let [index, connection] of this.connections.entries()) {

				if (connection.id.toString('hex') === newConnection.id.toString('hex')) {

					newConnection.logger.warn(`ProxyConnectionsManager pushConnection, delete connection, id: ${newConnection.id.toString('hex')}, host: ${newConnection.host}, port: ${newConnection.port}`);

					this.connections.splice(index, 1);
				}
			}
		});
		
		// connection with new address
        loggerP2p.info(`ProxyConnectionsManager pushConnection, host: ${newConnection.host}, port: ${newConnection.port}`);

		// add new connection
        this.connections.push(newConnection);
        
        //
        const node = unlManager.unlNotIncludeSelf.find(node => node.host === newConnection.host && node.port === newConnection.port);
        if(node)
        {
            this.emit("addressConnected", node.address);
        }
    }
    
    /**
	 * @param {Number} cmd 
	 * @param {*} data 
	 */
    sendAll(cmd, data) {
        assert(typeof cmd === "number", `ProxyConnectionsManager sendAll, cmd should be a Number, now is ${typeof cmd}`);

        for (let connection of this.connections) {
            if (connection.checkIfCanWrite()) {

                // ripple protocol and host is invalid
                if(cmd !== PROTOCOL_HEART_BEAT 
                    && !unlManager.unlNotIncludeSelf.find(node => node.host === connection.host && node.p2pPort === connection.port))
                {
                    continue;
                }

                //
                try {
                    connection.write(cmd, data);
                }
                catch (e) {
                    loggerP2p.error(`ProxyConnectionsManager sendAll, send msg to address: ${connection.address}, host: ${connection.host}, port: ${connection.port}, ${process[Symbol.for("getStackInfo")](e)}`);
                }
            }
        }
    }

	/**
	 * @return {Array}
	 */
    getAllConnections() {
        const connectionsInfo = [];

        for (let connection of this.connections) {
            connectionsInfo.push({
                address: connection.address ? connection.address.toString("hex") : 'undefined',
                url: connection.socket ? `${connection.host}:${connection.port}` : 'undefined',
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