const utils = require("../../utils");
const assert = require("assert");

const Buffer = utils.Buffer;
const toBuffer = utils.toBuffer;
const rlp = utils.rlp;

const MAX_MESSAGE_DATA_SIZE = 1024 * 1024 * 50;

class Message
{
	constructor(data)
	{
		data = data || {};

    const fields = [{
      name: "cmd",
      length: 4,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "data",
      length: MAX_MESSAGE_DATA_SIZE,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }];

    utils.defineProperties(this, fields, data);

    const self = this;
    Object.defineProperty(self, "length", {
      enumerable: true,
      configurable: true,
      get: () => {
      	return rlp.encode(self.raw).length;
      }
    });

    this.serialize = function()
    {
      return Buffer.concat([utils.setLength(toBuffer(this.length), 4), rlp.encode(this.raw)]);
    }
	}
}

module.exports = Message;