const utils = require("../../utils");
const assert = require("assert");

const Buffer = utils.Buffer;

class MessageChunk
{
	constructor(data)
	{
    if(data)
    {
      assert(Buffer.isBuffer(data), `MessageChunk constructor, data should be an Buffer, now is ${typeof data}`);
    }

    this.data = data || Buffer.alloc(0);
    this.readPos = 0;

    const self = this;
    Object.defineProperty(self, "length", {
      enumerable: true,
      configurable: true,
      get: () => {
        return self.data.length;
      }
    });

    Object.defineProperty(self, "remainDataSize", {
      enumerable: true,
      configurable: true,
      get: () => {
        return self.data.length - self.readPos;
      }
    })
	}

  read(count)
  {
    assert(typeof count === "number", `MessageChunk read, count should be a Number, now is ${typeof count}`);

    const returnData = this.data.slice(this.readPos, this.readPos + count);
    this.readPos += count;
    return returnData;
  }

  readRemainData()
  {
    return this.read(this.remainDataSize)
  }
}

module.exports = MessageChunk;