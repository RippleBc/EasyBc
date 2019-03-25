const assert = require("assert");
const Message = require("./message");
const MessageChunk = require("./message_chunk");
const MessageChunkQueue = require("./message_chunk_queue");

const END_CLEAR_SEND_BUFFER_TIME_DEAY = 1000 * 10;

class Connection
{
	constructor(socket, dispatcher)
	{
		this.authorized = false;
		this.socket = socket;
		this.dispatcher = dispatcher;
		this.closed = false;

		this.sendMessageChunkQueue = new MessageChunkQueue();
		this.receiveMessageChunkQueue = new MessageChunkQueue();

		const self = this;

		socket.on("data", data => {
			if(!self.closed)
			{
				self.receiveMessageChunkQueue.push(data);
				self.parse();
			}
			
		});

		// if allowHalfOpen is true, the other end of the connection may send data, but will not read data
		socket.end("end", () => {
			self.setTimeout(() => {
				self.closed = true;
			}, END_CLEAR_SEND_BUFFER_TIME_DEAY);
		});
	}

	parse()
	{
		let message;
		try
		{
			message = this.sendMessageChunkQueue.getMessage();
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
				message = this.sendMessageChunkQueue.getMessage();
			}
			catch(e)
			{
				socket.end();
			}
		}

	}
}