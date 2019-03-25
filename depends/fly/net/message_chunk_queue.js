const MessageChunk = require("./message_chunk");
const utils = require("../utils");

const Buffer = utils.Buffer;
const CMD_DATA_SIZE = 4;

class MessageChunkQueue
{
	constructor()
	{
		this.data = [];
		this.messagesSize = 0;
		this.curMessageLength = 0;
	}

	push(data)
	{
		assert(Buffer.isBuffer(data), `MessageChunkQueue push, data should be an Buffer, now is ${typeof data}`);

		let messageChunk = new MessageChunk(data);

		this.data.push();
		this.messagesSize += messageChunk.length();
	}

	getMessage()
	{
		if(this.messagesSize < CMD_DATA_SIZE)
		{
			return undefined;
		}

		if(this.messagesSize < this.curMessageLength)
		{
			return undefined;
		}

		

	}
}