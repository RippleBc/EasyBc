const assert = require("assert");
const Message = require("./message");
const MessageChunk = require("./message_chunk");
const MessageChunkQueue = require("./message_chunk_queue");

const END_CLEAR_SEND_BUFFER_TIME_DEAY = 1000 * 10;

class Connection
{
	constructor(opts)
	{
		this.socket = opts.socket;
		this.dispatcher = opts.dispatcher;
		this.authorized = false;
		this.closed = false;

		this.sendKenelBufferFull = false;
		this.sendBufferArray = [];
		this.receiveMessageChunkQueue = new MessageChunkQueue();

		const self = this;

		this.socket.on("data", data => {
			if(!self.closed)
			{
				self.receiveMessageChunkQueue.push(data);
				self.parse();
			}
			
		});

		// if allowHalfOpen is true, the other end of the connection may send data, but will not read data
		this.socket.on("end", () => {
			self.setTimeout(() => {
				self.closed = true;
			}, END_CLEAR_SEND_BUFFER_TIME_DEAY);
		});

		// socket write buffer is empty
		this.socket.on("drain", () => {
			self.sendKenelBufferFull = false;
			self.flush();
		});
	}

	flush()
	{
		// check if send kenel buffer is full
		if(this.sendKenelBufferFull)
		{
			return;
		}

		for(let i = 0; i < this.sendBufferArray.length; i++)
		{
			const writeResult = this.socket.write(this.sendBufferArray[i]);

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
			socket.end();
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
				socket.end();
			}
		}
	}
}

module.exports = Connection;