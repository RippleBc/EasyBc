const utils = require("../../utils");
const assert = require("assert");

const Buffer = utils.Buffer;
const toBuffer = utils.toBuffer;

class Message
{
	constructor(data)
	{
		this.json = {
			"cmd": undefined, 
			"data": undefined
		};

		if(data)
		{
			assert(Buffer.isBuffer(data), `Message constructor, data should be an Buffer, now is ${typeof data}`);
		
			try
			{
				this.json = JSON.parse(data);
				if(this.json.cmd === undefined)
				{
					throw new Error("data property cmd can not be undefined");
				}
				if(this.json.data === undefined)
				{
					throw new Error("data property data can not be undefined");
				}
			}
			catch(e)
			{
				throw new Error(`Message constructor, ${e}`);
			}
		}
		
		const self = this;
		Object.defineProperty(self, "cmd", {
      enumerable: true,
      configurable: true,
      get: () => {
      	return self.json.cmd;
      },
      set: (cmd) => {
      	self.json.cmd = cmd;
      }
    });

    Object.defineProperty(self, "data", {
      enumerable: true,
      configurable: true,
      get: () => {
      	return self.json.data;
      },
      set: (data) => {
      	self.json.data = data;
      }
    });
	}

	serialize()
	{
		return toBuffer(JSON.stringify(this.json));
	}
}

module.exports = Message;