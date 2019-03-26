const MessageChunk = require("./message_chunk");
const Message = require("./message");
const utils = require("../../utils");
const assert = require("assert");

const Buffer = utils.Buffer;
const bufferToInt = utils.bufferToInt;

const CMD_DATA_SIZE = 4;
const MAX_MSG_LENGTH = 1024 * 1024 * 10;

class MessageChunkQueue
{
	constructor()
	{
		this.data = [];
		this.curMessageLength = 0;

		const self = this;
		Object.defineProperty(self, "length", {
      enumerable: true,
      configurable: true,
      get: () => {
        let length = 0;
        for(let i = 0; i < self.data.length; i++)
        {
        	length += self.data[i].remainDataSize;
        }

        return length;
      }
    });
	}

	push(data)
	{
		assert(Buffer.isBuffer(data), `MessageChunkQueue push, data should be an Buffer, now is ${typeof data}`);

		const messageChunk = new MessageChunk(data);

		this.data.push(messageChunk);
	}

	getMessage()
	{
		if(this.length < CMD_DATA_SIZE)
		{
			return undefined;
		}

		// fetch msg size
		if(this.curMessageLength === 0)
		{
			let messageSizeBuffer = Buffer.alloc(0);
			while(messageSizeBuffer.length < CMD_DATA_SIZE)
			{
				const messageChunk = this.data[0];
				if(messageChunk.remainDataSize + messageSizeBuffer.length > CMD_DATA_SIZE)
				{
					messageSizeBuffer = Buffer.concat([messageSizeBuffer, messageChunk.read(CMD_DATA_SIZE - messageSizeBuffer.length)]);
					break;
				}
				else
				{
					messageSizeBuffer = Buffer.concat([messageSizeBuffer, messageChunk.readRemainData()]);

					const delMessageChunk = this.data.splice(0, 1);
				}
			}

			// init curMessageLength
			this.curMessageLength = bufferToInt(messageSizeBuffer);

			// check msg size
			if(this.curMessageLength > MAX_MSG_LENGTH)
			{
				throw Error(`MessageChunkQueue getMessage, message size must not bigger than ${MAX_MSG_LENGTH}, now is ${this.curMessageLength}`);
			}
		}

		// check msg size
		if(this.length < this.curMessageLength)
		{
			return undefined;
		}

		// fetch message data
		let messageDataBuffer = Buffer.alloc(0);
		while(messageDataBuffer.length < this.curMessageLength)
		{
			const messageChunk = this.data[0];
			if(messageChunk.remainDataSize + messageDataBuffer.length > this.curMessageLength)
			{
				messageDataBuffer = Buffer.concat([messageDataBuffer, messageChunk.read(this.curMessageLength - messageDataBuffer.length)]);
				break;
			}
			else
			{
				messageDataBuffer = Buffer.concat([messageDataBuffer, messageChunk.readRemainData()]);
				
				this.data.splice(0, 1);
			}
		}

		this.curMessageLength = 0;

		// init message
		return new Message(messageDataBuffer);
	}
}

module.exports = MessageChunkQueue;