const Base = require("./base");
const utils = require("../../../depends/utils");

const Buffer = utils.Buffer;

class CandidateDigest extends Base
{
	constructor(data)
	{
		super({ name: 'candidateDigest' });

		data = data || {};

    const fields = [{
      name: "sequence",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "hash",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "number",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "timestamp",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "view",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "digest",
      default: Buffer.alloc(32)
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

module.exports = CandidateDigest;