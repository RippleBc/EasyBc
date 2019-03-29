const process = require("process");
const Base = require("./base");
const utils = require("../../../depends/utils");
const {AGREEMENT_THRESHHOLD} = require("../../constant");
const {getNodeNum, checkNodeAddress} = require("../../nodes");

const logger = process[Symbol.for("loggerConsensus")];

const rlp = utils.rlp;
const Buffer = utils.Buffer;

class RippleBlock extends Base
{
	constructor(data)
	{
		super();

		data = data || {};

    const fields = [{
      name: "block",
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

  /**
   * Validates the signature
   * Checks block's property and signature
   */
  validate()
  {
    // verify
    if(!this.verifySignature())
    {
      logger.error("RippleBlock validate, invalid signature");
    }

    // check node address
    if(!this.checkAddress(this.from))
    {
    	logger.error("RippleBlock validate, invalid address");
    }

    return true;
  }
}

module.exports = RippleBlock;