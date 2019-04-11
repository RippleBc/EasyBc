const utils = require("../../../depends/utils");
const Base = require("./base");

const Buffer = utils.Buffer;

/**
 * Creates a new Counter object
 *
 * @class
 * @constructor
 * @prop 
 */
class Counter extends Base
{
	constructor(data)
	{
    super();

		data = data || {};

		// Define Properties
    const fields = [{
      name: "round",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "stage",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
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

module.exports = Counter;