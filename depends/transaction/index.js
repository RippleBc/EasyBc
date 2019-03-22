const utils = require("../utils");
const assert = require("assert");

const Buffer = utils.Buffer;
const sha256 = utils.sha256;
const rlp = utils.rlp;
const BN = utils.BN;

class Transaction
{
  constructor(data)
  {
    data = data || {};

    const fields = [{
      name: "nonce",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "to",
      length: 20,
      default: Buffer.alloc(20)
    }, {
      name: "value",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "data",
      length: 32,
      alias: "input",
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
      default: Buffer.alloc(32)
    }, {
      name: "s",
      length: 32,
      allowZero: true,
      default: Buffer.alloc(32)
    }];

    utils.defineProperties(this, fields, data);

    /**
     * @property {Buffer} from (read only). sender address of this transaction, mathematically derived from other parameters.
     * @memberof Transaction
     */
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
   * Computes a sha3-256 hash of the serialized tx
   * @param {Boolean} includeSignature - whether or not to inculde the signature
   * @return {Buffer}
   */
  hash(includeSignature = true)
  {
    assert(typeof includeSignature === "boolean", `Transaction hash, includeSignature should be an Boolean, now is ${typeof includeSignature}`);

    let items;
    if(includeSignature)
    {
      items = this.raw;
    }
    else
    {
      items = this.raw.slice(0, 4);
    }

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
   * The up front amount that an account must have for this transaction to be valid
   * @return {BN}
   */
  getUpfrontCost()
  {
    return new BN(this.value);
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
   * sign a transaction with a given private key
   * @param {Buffer} privateKey
   */
  sign(privateKey)
  {
    assert(Buffer.isBuffer(privateKey), `Transaction sign, privateKey should be an Buffer, now is ${typeof privateKey}`);

    const msgHash = this.hash(false);
    const sig = utils.ecsign(msgHash, privateKey);

    // copy sig's properties v, s, r to this
    Object.assign(this, sig);
  }

  /**
   * Validates the signature, checks transaction's property and signature
   * @return {Object}
   * @prop {Boolean} state - if transaction is valid
   * @prop {String} msg - failed info.
   */
  validate()
  {
    const errors = [];

    if(new BN(this.nonce).eqn(0))
    {
      errors.push("property nonce can not be zero");
    }

    if(new BN(this.value).eqn(0))
    {
      errors.push("property value can not be zero");
    }

    if(this.to.toString("hex") === "0000000000000000000000000000000000000000")
    {
      errors.push("property to can not be zero");
    }

    try
    {
      if(this.to.toString("hex") === this.from.toString("hex"))
      {
        errors.push("property from can not be equal to property to");
      }
    }
    catch(e)
    {
      errors.push("couldn't recover public key from signature");
    }

    if(!this.verifySignature())
    {
      errors.push("invalid signature");
    }

    return {
      state: errors.length ? false : true,
      msg: `transaction validate failed, ${errors.join("\r\n")}`
    }
  }
}

module.exports = Transaction;