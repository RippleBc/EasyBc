const Base = require("./base")
const util = require("../../../utils")
const {AGREEMENT_THRESHHOLD} = require("../../constant")
const {getNodeNum, checkNodeAddress} = require("../../nodes")

const rlp = util.rlp;

class RippleBlock extends Base
{
	constructor(data)
	{
		super();

		data = data || {};

		// Define Properties
    const fields = [{
      name: "block",
      allowZero: true,
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

    /**
     * Returns the rlp encoding of the block
     * @method serialize
     * @memberof Transaction
     * @return {Buffer}
     */

    // attached serialize
    util.defineProperties(this, fields, data);
	}

  /**
   * Validates the signature
   * Checks block's property and signature
   * @param {Boolean} [stringError=false] whether to return a string with a description of why the validation failed or return a Boolean
   * @return {Boolean|String}
   */
  validateSignatrue(stringError)
  {
    const errors = [];

    // verify
    if(!this.verifySignature())
    {
      errors.push("class RippleBlock validateSignatrue, Invalid RippleBlock Signature");
    }

    // check node address
    if(!checkNodeAddress(this.from))
    {
    	errors.push("class RippleBlock validateSignatrue, Invalid RippleBlock address");
    }

    if(stringError === undefined || stringError === false)
    {
      return errors.length === 0;
    }
    else
    {
      return errors.join(" ");
    }
  }

  /**
   * @return {RippleBlock} block
   */
  getConsistentBlocks()
  {
    let blocks = {};
    for(let i = 0; i < this.length; i++)
    {
      let block = this.data[i];
      let key = util.baToHexString(block.hash());
      if(!blocks[key])
      {
        blocks[key] = {
          bl: block,
          num: 0
        };
      }

      blocks[key].num++;
    }

    // get majority block
    let tmp = 0;
    let block;
    for(let hash in blocks)
    {
      if(blocks[hash].num > tmp)
      {
        tmp = blocks[hash].num;
        block = blocks[hash].bl;
      }
    }

    let nodeNum = getNodeNum() + 1;
    // check threshhold
    if(tmp / nodeNum >= AGREEMENT_THRESHHOLD)
    {
      console.log("111: " + tmp + ", 222: " + nodeNum + ", 333: " + tmp / nodeNum);

      return block;
    }
    return null;
  }
}

module.exports = RippleBlock;