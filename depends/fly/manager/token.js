const utils = require("../../utils");
const assert = require("assert");

const Buffer = utils.Buffer;
const rlp = utils.rlp;

class Token
{
  constructor(data)
  {
    data = data || {};

    const fields = [{
      name: "nonce",
      length: 32,
      allowZero: true,
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
      default: Buffer.alloc(32)
    }, {
      name: "s",
      length: 32,
      allowZero: true,
      default: Buffer.alloc(32)
    }];

    utils.defineProperties(this, fields, data);

    /**
     * @property {Buffer} address (read only). sender address of this transaction, mathematically derived address other parameters.
     * @memberof Token
     */
    Object.defineProperty(this, "address", {
      enumerable: true,
      configurable: true,
      get: function() {
        if(this._address)
        {
          return this._address;
        }
        const publicKey = this.getSenderPublicKey();
        this._address = utils.publicToAddress(publicKey);
        return this._address;
      }
    });
  }

  /**
   * Returns the public key of the sender
   * @return {Buffer}
   */
  getSenderPublicKey()
  {
    if(!this._senderPubKey || !this._senderPubKey.length)
    {
      let v = utils.bufferToInt(this.v);
      this._senderPubKey = utils.ecrecover(this.nonce, v, this.r, this.s);
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

    return utils.ecverify(this.nonce, this.r, this.s, this._senderPubKey);
  }

  /**
   * sign a transaction with a given private key
   * @param {Buffer} privateKey
   */
  sign(privateKey)
  {
    assert(Buffer.isBuffer(privateKey), `Token sign, privateKey should be an Buffer, now is ${typeof privateKey}`);

    const sig = utils.ecsign(this.nonce, privateKey);

    // copy sig's properties v, s, r to this
    Object.assign(this, sig);
  }
}

module.exports = Token;