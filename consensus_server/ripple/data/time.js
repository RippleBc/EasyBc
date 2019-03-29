const util = require("../../../utils")
const Base = require("./base")
const {checkNodeAddress} = require("../../nodes")

/**
 * Creates a new Time object
 *
 * @class
 * @constructor
 * @prop 
 */
class Time extends Base
{
	constructor(data)
	{
    super();

		data = data || {};

		// Define Properties
    const fields = [{
      name: "time",
      allowLess: true,
      default: util.Buffer.alloc(0)
    }, {
      name: "v",
      length: 1,
      allowZero: true,
      allowLess: true,
      default: util.Buffer.from([0x1c])
    }, {
      name: "r",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: util.Buffer.alloc(0)
    }, {
      name: "s",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: util.Buffer.alloc(0)
    }];

    util.defineProperties(this, fields, data);
	}

  /**
   * Validates the signature
   * Checks block's property and signature
   */
  validate()
  {
    // verify
    if(!this.verifySignature())
    {
      logger.error("Time validate, invalid signature");
    }

    // check node address
    if(!this.checkAddress(this.from))
    {
      logger.error("Time validate, invalid address");
    }

    return true;
  }
}

module.exports = Time;