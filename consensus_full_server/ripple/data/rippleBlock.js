const Base = require("./base");
const utils = require("../../../depends/utils");

const rlp = utils.rlp;
const Buffer = utils.Buffer;

class RippleBlock extends Base
{
	constructor(data)
	{
		super();

		data = data || {};

    const fields = [{
      name: "block"
    }, {
      name: "v",
      length: 1,
      allowZero: true,
      allowLess: true,
      default: Buffer.from([0x1c])
    }, {
      name: "r",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "s",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }];

    utils.defineProperties(this, fields, data);
	}
}

module.exports = RippleBlock;