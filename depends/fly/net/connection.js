const assert = require("assert");
const Message = require("./message");
const MessageChunk = require("./message_chunk");
const MessageChunkQueue = require("./message_chunk_queue");
const Socket = require("net").Socket;

const END_CLEAR_SEND_BUFFER_TIME_DEAY = 1000 * 5;
const HEART_BEAT_TIME = 1000 * 10;

class Connection
{
	constructor(opts)
	{
		assert(opts.socket instanceof Socket, `Connection	constructor, opts.socket should be a Socket Object, now is ${typeof opts.socket}`);
		assert(typeof opts.dispatcher	=== "function", `Connection	constructor, opts.dispatcher should be a Function, now is ${typeof opts.dispatcher}`);

		this.socket = opts.socket;
		this.dispatcher = opts.dispatcher;
		this.logger = opts.logger || {info: console.info, warn: console.warn, error: console.error};

		this.authorized = false;
		this.address = "";

		this.closed = false;

		this.sendKenelBufferFull = false;
		this.sendBufferArray = [];

		this.receiveMessageChunkQueue = new MessageChunkQueue();

		const self = this;

		this.socket.setTimeout(HEART_BEAT_TIME, () => {
        self.socket.end();
    });

		this.socket.on("data", data => {
			if(!self.closed)
			{
				self.receiveMessageChunkQueue.push(data);
				self.parse();
			}
		});

		this.socket.on("end", () => {
			let endTimeout = setTimeout(() => {
				if(!self.socket.destroyed)
				{
					self.socket.end();
				}
			}, END_CLEAR_SEND_BUFFER_TIME_DEAY);

			endTimeout.unref();
		});

		this.socket.on("drain", () => {
			self.sendKenelBufferFull = false;
			self.flush();
		});

		this.socket.on("close", () => {
			self.closed = true;
		});

		this.socket.on("error", e => {
			self.logger.error(`socket ${self.address} throw error, ${e}`);
		});
	}

	close()
	{
		this.socket.end();
	}

	flush()
	{
		// check if send kenel buffer is full
		if(this.sendKenelBufferFull)
		{
			return;
		}

		while(this.sendBufferArray.length > 0)
		{
			const writeResult = this.socket.write(this.sendBufferArray[0]);

			this.sendBufferArray.splice(0, 1);

			if(writeResult === false)
			{
				this.sendKenelBufferFull = true;
				break;
			}
		}
	}

	/**
	 * @param {Buffer} data
	 */
	write(data)
	{
		assert(Buffer.isBuffer(data), `Connection write, data should be an Buffer, now is ${typeof data}`);

		this.sendBufferArray.push(data);
		
		this.flush();
	}

	parse()
	{
		let message;
		try
		{
			message = this.receiveMessageChunkQueue.getMessage();
		}
		catch(e)
		{
			// half close socket, socket will not write data, but will read data from socket
			this.socket.end();
		}

		while(message)
		{
			this.dispatcher(message);

			try
			{
				message = this.receiveMessageChunkQueue.getMessage();
			}
			catch(e)
			{
				// half close socket, socket will not write data, but will read data from socket
				this.socket.end();
			}
		}
	}
}

module.exports = Connection;