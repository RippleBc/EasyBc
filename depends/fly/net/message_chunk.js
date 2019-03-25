const utils = require("../utils");
const assert = require("assert");

const Buffer = utils.Buffer;
const MAX_MSG_LENGTH = 1024 * 1024 * 10;

class MessageChunk
{
	constructor(data)
	{
    assert(Buffer.isBuffer(data), `MessageChunk constructor, data should be an Buffer, now is ${typeof data}`);

    this.data = data;
    this.writePos = 0;
    this.readPos = 0;
	}

  length()
  {
    this.data.length();
  }

	getReadPos()
  {
    return this.readPos;
  }

  setReadPos(count)
  {
    assert(typeof count === "number", `MessageChunk readPos, count should be a Number, now is ${typeof count}`);

    this.readPos += count;
  }

  getWritePos()
  {
    return this.writePos;
  }

  setWritePos(count)
  {
    assert(typeof count === "number", `MessageChunk writePos, count should be a Number, now is ${typeof count}`);

    this.writePos += count;
  }
}