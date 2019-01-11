const util = require('../utils')
const BN = util.BN;

/**
 * Creates a new transaction object.
 *
 * @example
 * var rawTx = {
 *   nonce: '0x00',
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: '0x00',
 *   data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
 *   v: '0x1c',
 *   r: '0x5e1d3a76fbf824220eafc8c79ad578ad2b67d01b0c2425eb1f1347e8f50882ab',
 *   s: '0x5bd428537f05f9830e93792f90ea6a3e2d1ee84952dd96edbae9f658f831ab13'
 * };
 * var tx = new Transaction(rawTx);
 *
 * @class
 * @param {Buffer | Array | Object} data a transaction can be initiailized with either a buffer containing the RLP serialized transaction or an array of buffers relating to each of the tx Properties, listed in order below in the exmple.
 *
 * Or lastly an Object containing the Properties of the transaction like in the Usage example.
 *
 * For Object and Arrays each of the elements can either be a Buffer, a hex-prefixed (0x) String , Number, or an object with a toBuffer method such as Bignum
 *
 * @property {Buffer} raw The raw rlp encoded transaction
 * @param {Buffer} data.nonce nonce number
 * @param {Buffer} data.to to the to address
 * @param {Buffer} data.value the amount of ether sent
 * @param {Buffer} data.data this will contain the data of the message or the init of a contract
 * @param {Buffer} data.v EC recovery ID
 * @param {Buffer} data.r EC signature parameter
 * @param {Buffer} data.s EC signature parameter
 * */
class Transaction
{
  constructor(data)
  {
    data = data || {};

    // Define Properties
    const fields = [{
      name: "nonce",
      length: 32,
      allowLess: true,
      default: util.Buffer.alloc(0)
    }, {
      name: "to",
      allowZero: true,
      length: 20,
      default: util.Buffer.alloc(0)
    }, {
      name: "value",
      length: 32,
      allowLess: true,
      default: util.Buffer.alloc(0)
    }, {
      name: "data",
      length: 32,
      alias: "input",
      allowLess: true,
      allowZero: true,
      default: util.Buffer.alloc(0)
    }, {
      name: "v",
      allowZero: true,
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
     * Returns the rlp encoding of the transaction
     * @method serialize
     * @memberof Transaction
     * @return {Buffer}
     */

    // attached serialize
    util.defineProperties(this, fields, data);

    /**
     * @property {Buffer} from (read only) sender address of this transaction, mathematically derived from other parameters.
     * @memberof Transaction
     */
    Object.defineProperty(this, "from", {
      enumerable: true,
      configurable: true,
      get: this.getSenderAddress.bind(this)
    })
  }

  /**
   * If the tx's to is equal to the creation address
   * @return {Boolean}
   */
  toCreationAddress () {
    return this.to.toString("hex") === this.getSenderAddress();
  }

  /**
   * Computes a sha3-256 hash of the serialized tx
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
      items = this.raw.slice(0, 4);
    }

    // create hash
    return util.keccak(util.rlp.encode(items));
  }

  /**
   * returns the sender's address
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
   * returns the public key of the sender
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
   * sign a transaction with a given private key
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
   * validates the signature
   * @param {Boolean} [stringError=false] whether to return a string with a description of why the validation failed or return a Boolean
   * @return {Boolean|String}
   */
  validate(stringError)
  {
    const errors = [];

    if(!this.verifySignature())
    {
      errors.push("Invalid Signature");
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

module.exports = Transaction