const util = require("../../../utils")
const Pool = require("./pool")

const rlp = util.rlp;

class Base extends Pool
{
	constructor()
	{
		super();
		
		/**
     * @property {Buffer} from (read only) sender address of this block, mathematically derived from other parameters.
     * @memberof Transaction
     */
    Object.defineProperty(this, "from", {
      enumerable: true,
      configurable: true,
      get: this.getSenderAddress.bind(this)
    });
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
   * sign with a given private key
   * @param {Buffer} privateKey
   */
  sign(privateKey)
  {
    const msgHash = this.hash(false);
    const sig = util.ecsign(msgHash, privateKey);

    // copy sig's properties v, s, r to this
    Object.assign(this, sig);
  }
}

module.exports = Base;