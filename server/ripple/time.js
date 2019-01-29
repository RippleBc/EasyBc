const semaphore = require("semaphore")
const util = require("../../utils")

/**
 * Creates a new Time object
 *
 * @class
 * @constructor
 * @prop 
 */
class Time
{
	constructor()
	{
		const self = this;
		self.data = [];

		// Define Properties
    const fields = [{
      name: "time",
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
     * Returns the rlp encoding of the candidate
     * @method serialize
     * @memberof Transaction
     * @return {Buffer}
     */

    // attached serialize
    util.defineProperties(this, fields, data);

		Object.defineProperty(self, "length", {
			enumerable: true,
      configurable: true,
			get: function() {
				return self.data.length;
			}
		});
	}

	push(time)
	{
		this.data.push(time);
	}

	getMidTime()
	{
		for(let i = 0; i < this.length - 1; i++)
		{
			for(let j = 0; j < this.length - 1 - i; j++)
			{
				if(this.data[j] < this.data[j + 1])
				{
					let temp = this.data[j];
					this.data[j] = this.data[j + 1];
					this.data[j + 1] = temp;
				}
			}
		}

		return this.data[math.ceil(this.length / 2)];
	}

	reset()
	{
		this.data = [];
	}

	/**
   * Computes a sha3-256 hash of the serialized txs
   * @param {Boolean} [includeSignature=true] whether or not to inculde the signature
   * @return {Buffer}
   */
  hash(includeSignature)
  {
    if(includeSignature === undefined)
    {
      includeSignature = true;
    }

    let items;
    if(includeSignature)
    {
      items = this.raw;
    }
    else
    {
      items = this.raw.slice(0, 1);
    }

    // create hash
    return util.keccak(util.rlp.encode(items));
  }

  /**
   * Returns the sender's address
   * @return {Buffer}
   */
  getSenderAddress()
  {
    if(this._from)
    {
      return this._from;
    }
    const pubkey = this.getSenderPublicKey();
    this._from = util.publicToAddress(pubkey);
    return this._from;
  }

  /**
   * Returns the public key of the sender
   * @return {Buffer}
   */
  getSenderPublicKey()
  {
    if(!this._senderPubKey || !this._senderPubKey.length)
    {
      const msgHash = this.hash(false);
      let v = util.bufferToInt(this.v);
      this._senderPubKey = util.ecrecover(msgHash, v, this.r, this.s);
    }
    return this._senderPubKey;
  }

  /**
   * Determines if the signature is valid
   * @return {Boolean}
   */
  verifySignature()
  {
    // compute publickey
    this.getSenderPublicKey();

    const msgHash = this.hash(false);

    return util.ecverify(msgHash, this.r, this.s, this._senderPubKey);
  }

  /**
   * sign a candidate with a given private key
   * @param {Buffer} privateKey
   */
  sign(privateKey)
  {
    const msgHash = this.hash(false);
    const sig = util.ecsign(msgHash, privateKey);

    // copy sig's properties v, s, r to this
    Object.assign(this, sig);
  }

  /**
   * Validates the signature
   * Checks candidate's property and signature
   * @param {Boolean} [stringError=false] whether to return a string with a description of why the validation failed or return a Boolean
   * @return {Boolean|String}
   */
  validate(stringError)
  {
    const errors = [];

    // verify
    if(!this.verifySignature())
    {
      errors.push("class Time validate, Invalid Time Signature");
    }

    // check address
    if(!nodes.checkNodeAddress(this.from))
    {
    	errors.push("class Time validate, Invalid Time address");
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
}

module.exports = Time;