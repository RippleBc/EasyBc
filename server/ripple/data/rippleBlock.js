const Base = require("./base")
const util = require("../../../utils")
const {AGREEMENT_THRESHHOLD} = require("../../constant")
const {getNodeNum} = require("../../nodes")

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
  validate(stringError)
  {
    const errors = [];

    // verify
    if(!this.verifySignature())
    {
      errors.push("class RippleBlock validate, Invalid RippleBlock Signature");
    }

    // check node address
    if(!nodes.checkNodeAddress(this.from))
    {
    	errors.push("class RippleBlock validate, Invalid RippleBlock address");
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
    let blocks;
    for(let i = 0; i < this.length; i++)
    {
      let block = this.data[i];
      if(!blocks[block.hash()])
      {
        blocks[block.hash()] = {
          bl: block,
          num: 0
        };
      }

      blocks[block.hash()].num++;
    }

    // get majority block
    let tmp = 0;
    let block;
    for(hash in blocks)
    {
      if(blocks[hash].num > tmp)
      {
        tmp = blocks[hash].num;
        block = blocks[hash].bl;
      }
    }

    // check threshhold
    if((tmp + 1) / getNodeNum() >= AGREEMENT_THRESHHOLD)
    {
      return block;
    }
    return null;
  }
}

module.exports = RippleBlock;