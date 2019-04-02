const assert = require("assert");
const utils = require("../../../depends/utils");
const { unl } = require("../../config.json");

const rlp = utils.rlp;
const sha256 = utils.sha256;

class Base
{
	constructor()
	{	
    Object.defineProperty(this, "from", {
      enumerable: true,
      configurable: true,
      get: function() {
        if(this._from)
        {
          return this._from;
        }
        const publicKey = this.getSenderPublicKey();
        this._from = utils.publicToAddress(publicKey);
        return this._from;
      }
    });
	}

	/**
   * Computes a sha3-256 hash of the serialized txs
   * @param {Boolean}  whether or not to inculde the signature
   * @return {Buffer}
   */
  hash(includeSignature = true)
  {
    assert(typeof includeSignature === "boolean", `Base hash, includeSignature should be an Boolean, now is ${typeof includeSignature}`);

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
    return sha256(rlp.encode(items));
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
      let v = utils.bufferToInt(this.v);
      this._senderPubKey = utils.ecrecover(msgHash, v, this.r, this.s);
    }
    
    return this._senderPubKey;
  }

  /**
   * Determines if the signature is valid
   * @return {Boolean}
   */
  verifySignature()
  {
    try
    {
      this.getSenderPublicKey();
    }
    catch(e)
    {
      return false;
    }

    const msgHash = this.hash(false);

    return utils.ecverify(msgHash, this.r, this.s, this._senderPubKey);
  }

  /**
   * sign with a given private key
   * @param {Buffer} privateKey
   */
  sign(privateKey)
  {
    assert(Buffer.isBuffer(privateKey), `Base sign, privateKey should be an Buffer, now is ${typeof privateKey}`);

    const msgHash = this.hash(false);
    const sig = utils.ecsign(msgHash, privateKey);

    // copy sig's properties v, s, r to this
    Object.assign(this, sig);
  }

  /**
   * @param {Buffer} address
   */
  checkAddress(address)
  {
    assert(Buffer.isBuffer(address), `Base checkAddress, address should be an Buffer, now is ${typeof address}`);

    for(let i = 0; i < unl.length; i++)
    {
      const node = unl[i];

      if(address.toString("hex") === uitls.stripHexPrefix(node.address))
      {
        return true;
      }
    }

    return false;
  }

  /**
   * Validates the signature
   */
  validate()
  {
    // verify
    if(!this.verifySignature())
    {
      logger.error("Base validate, invalid signature");
    }

    // check node address
    if(!this.checkAddress(this.from))
    {
      logger.error("Base validate, invalid address");
    }

    return true;
  }
}

module.exports = Base;