const assert = require("assert");
const Message = require("./message");
const MessageChunk = require("./message_chunk");
const MessageChunkQueue = require("./message_chunk_queue");

const END_CLEAR_SEND_BUFFER_TIME_DEAY = 1000 * 5;
const HEART_BEAT_TIME = 1000 * 10;

class Connection
{
	constructor(opts)
	{
		this.socket = opts.socket;
		this.dispatcher = opts.dispatcher;
		this.logger = opts.logger || {info: console.info, warn: console.warn, error: console.error};
		this.authorized = false;
		this.closed = false;
		this.address = "";

		this.endTimeOut;

		this.sendKenelBufferFull = false;
		this.sendBufferArray = [];
		this.receiveMessageChunkQueue = new MessageChunkQueue();

		const self = this;
		let timeOut;

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

		// the other end of the connection will continue read data, but will not write data
		this.socket.on("end", () => {
			self.endTimeout = setTimeout(() => {
				if(!self.socket.destroyed)
				{
					// half close socket, socket will not write data, but will read data from socket
					self.socket.end();
				}
			}, END_CLEAR_SEND_BUFFER_TIME_DEAY);
		});

		this.socket.on("drain", () => {
			self.sendKenelBufferFull = false;
			self.flush();
		});

		this.socket.on("close", () => {
			if(self.endTimeout)
			{
				clearInterval(self.endTimeout);
			}

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