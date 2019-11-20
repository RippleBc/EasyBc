const assert = require("assert");
const Message = require("../depends/fly/net/message")

const p2p = process[Symbol.for("p2p")]

class Processor {
    constructor()
    {

    }

    /**
     * 
     * @param {String} host 
     * @param {Number} port 
     * @param {Message} data 
     */
    handleMessage(host, port, message)
    {
        assert(typeof host === 'string', `Processor handleMessage, host should be a String, now is ${typeof host}`);
        assert(typeof prot === 'number', `Porcessor handleMessage, port should be a Number, now is ${typeof port}`);
        assert(message instanceof Message, `Processor handleMessage, message should be a Message Object, now is ${typeof message}`);

        const cmd = bufferToInt(message.cmd);
        const data = message.data;

        p2p.send(cmd, data)
    }
}

module.exports = Processor;