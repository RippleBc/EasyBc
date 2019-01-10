const createKeccakHash = require("keccak")
const secp256k1 = require("secp256k1")
const assert = require("assert")
const rlp = require("rlp")
const createHash = require("create-hash")
const Buffer = require("safe-buffer").Buffer
const { randomBytes } = require('crypto')

exports.stripHexPrefix = require('strip-hex-prefix');
exports.BN = require('bn.js');

const SANITIZED_PUBLIC_KEY = 64;
const PREFIX_OF_UNSANITIZED_PUBLIC_KEY = 0x04;
/***************************************** ecc begin *****************************************/

/**
 * Create an ECDSA privateKey
 * @return {Buffer}
 */
exports.createPrivateKey = function()
{
  let privateKey = Buffer.alloc(32);

  // generate privateKey
  do 
  {
    privateKey = randomBytes(32);
  }
  while (!secp256k1.privateKeyVerify(privateKey));

  return privateKey;
}

/**
 * Verify an ECDSA privateKey.
 * @param {Buffer} privateKey
 * @return {Boolean}
 */
exports.isValidPrivate = function(privateKey)
{
  return secp256k1.privateKeyVerify(privateKey);
}

/**
 * Verify an ECDSA publicKey.
 * @param {Buffer} publicKey an uncompressed publickkey
 * @param {Boolean} [sanitize=false] Accept public keys in other formats
 * @return {Boolean}
 */
exports.isValidPublic = function(publicKey, sanitize)
{
  if(publicKey.length === SANITIZED_PUBLIC_KEY)
  {
    // Convert to SEC1 for secp256k1, the formal publickey is 65 bytes length, add the prefix 0x04 for publickey
    return secp256k1.publicKeyVerify(Buffer.concat([Buffer.from([PREFIX_OF_UNSANITIZED_PUBLIC_KEY]), publicKey]));
  }

  if(!sanitize)
  {
    return false;
  }

  assert(publicKey.length !== SANITIZED_PUBLIC_KEY);

  // verify an uncompressed publick key
  return secp256k1.publicKeyVerify(publicKey);
}

/**
 * Convert a publicKey to address form.
 * @param {Buffer|Array|String} publicKey an uncompressed key
 * @param {Boolean} [sanitize=false] Accept public keys in other formats
 * @return {Buffer}
 */
exports.publicToAddress = function(publicKey, sanitize)
{
  publicKey = exports.toBuffer(publicKey);

  // Convert an compressed publicKey to sanitized uncompressed publicKey.
  if(sanitize && (publicKey.length !== SANITIZED_PUBLIC_KEY))
  {
    publicKey = secp256k1.publicKeyConvert(publicKey, false).slice(1);
  }

  // Check if public key is sanitized uncompressed form
  assert(publicKey.length === SANITIZED_PUBLIC_KEY);

  // Only take the lower 20 bytes of the hash
  return exports.keccak(publicKey).slice(-20);
}

/**
 * Compute an sanitzied uncompressed publickkey.
 * @param {Buffer|Array|String} privateKey A private key must be 64 bytes wide
 * @return {Buffer}
 */
exports.privateToPublic = function(privateKey)
{
  privateKey = exports.toBuffer(privateKey);

  return secp256k1.publicKeyCreate(privateKey, false).slice(1);
}

/**
 * Convert uncompressed publicKey to sanitized uncompressed form.
 * @param {Buffer|Array|String} publicKey
 * @return {Buffer}
 */
exports.importPublic = function(publicKey)
{
  publicKey = exports.toBuffer(publicKey);

  if(publicKey.length !== SANITIZED_PUBLIC_KEY)
  {
    publicKey = secp256k1.publicKeyConvert(publicKey, false).slice(1);
  }

  return publicKey;
}

/**
 * ECDSA sign
 * @param {Buffer} msgHash
 * @param {Buffer} privateKey
 * @return {Object}
 */
exports.ecsign = function(msgHash, privateKey)
{
  if(!exports.isValidPrivate(privateKey))
  {
    throw new Error(`utils ecsign, privatekey is invalid ${privateKey.toString("hex")}.`);
  }

  const sig = secp256k1.sign(msgHash, privateKey);

  const ret = {};
  ret.r = sig.signature.slice(0, 32);
  ret.s = sig.signature.slice(32, 64);
  ret.v = sig.recovery + 27;
  return ret;
}

/**
 * ECDSA verify
 * @param {Buffer} msgHash
 * @param {Object} signature
 * @param {Buffer} publicKey sanitized uncompressed publickey
 * @return {Boolean}
 */
exports.ecverify = function(msgHash, signature, publicKey)
{
  if(!exports.isValidPublic(publicKey))
  {
    throw new Error(`utils ecsign, publickey is invalid ${publicKey.toString("hex")}.`);
  }

  const sig = Buffer.concat([signature.r, signature.s]);

  // Convert sanitized uncompressed publickey to uncompressed publickey
  const unsanitizedPublickKey = Buffer.concat([Buffer.from([4]), publicKey]);

  // Convert uncompressed publickey to compressed publickey
  const compressedPulickKey = secp256k1.publicKeyConvert(unsanitizedPublickKey, true);

  return secp256k1.verify(msgHash, sig, compressedPulickKey);
}

/**
 * ECDSA public key recovery from signature
 * @param {Buffer} msgHash
 * @param {Number} v
 * @param {Buffer} r
 * @param {Buffer} s
 * @return {Buffer} publicKey
 */
exports.ecrecover = function (msgHash, v, r, s) {
  const signature = Buffer.concat([exports.setLength(r, 32), exports.setLength(s, 32)], 64);
  const recovery = v - 27;
  if (recovery !== 0 && recovery !== 1)
  {
    throw new Error('Invalid signature v value')
  }
  const senderPubKey = secp256k1.recover(msgHash, signature, recovery);
  
  return secp256k1.publicKeyConvert(senderPubKey, false).slice(1)
}

/***************************************** ecc end *****************************************/

/***************************************** sha-3 begin *****************************************/
/**
 * Creates Keccak hash of the input
 * @param {Buffer|Array|String|Number} value the input data
 * @param {Number} [bits=256] the Keccak width
 * @return {Buffer}
 */
exports.keccak = function(value, bits)
{
  value = exports.toBuffer(value);

  if(!bits)
  {
    bits = 256;
  }

  return createKeccakHash('keccak' + bits).update(value).digest();
}

/**
 * Creates Keccak-256 hash of the input, alias for keccak(value, 256)
 * @param {Buffer|Array|String|Number} value the input data
 * @return {Buffer}
 */
exports.keccak256 = function(value)
{
  return exports.keccak(value);
}

/**
 * Creates SHA-3 (Keccak) hash of the input [OBSOLETE]
 * @param {Buffer|Array|String|Number} a the input data
 * @param {Number} [bits=256] the SHA-3 width
 * @return {Buffer}
 */
exports.sha3 = exports.keccak;

/***************************************** sha-3 end *****************************************/

/***************************************** buffer begin *****************************************/
/**
 * Pads a String to have an even length
 * @param {String} value
 * @return {String} output
 */
exports.padToEven = function(value)
{
  if(typeof value !== "string") {
    throw new Error(`utils padToEven, while padding to even, value must be string, is currently ${typeof value}.`);
  }

  if(value.length % 2) {
    value = `0${value}`;
  }

  return value;
}

/**
 * Check if string is hex string of specific length
 * @param {String} value
 * @param {Number} length indicate the byte length of value
 * @returns {Boolean} output
 */
exports.isHexString = function(value, length) {
  if(typeof value !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/))
  {
    return false;
  }

  if (length && value.length !== 2 + 2 * length)
  { 
    return false; 
  }

  return true;
}

/**
 * Attempts to turn a value into a Buffer. As input it supports Buffer, String, Number, null/undefined, BN and other objects with a toArray() method.
 * @param {*} value the value
 */
exports.toBuffer = function(value)
{
  if(!Buffer.isBuffer(value))
  {
    if (Array.isArray(value))
    {
      value = Buffer.from(value);
    } 
    else if(typeof value === "string")
    {
      // note!!! if value is a hex string a hex string, prefix zero will be deleted
      if(exports.isHexString(value))
      {
        value = Buffer.from(exports.padToEven(exports.stripHexPrefix(value)), "hex");
      }
      else
      {
        value = Buffer.from(value);
      }
    }
    else if(typeof value === "number")
    {
      value = exports.intToBuffer(value);
    }
    else if(value === null || value === undefined)
    {
      // create an uninitialized buffer (potentially unsafe)
      value = Buffer.allocUnsafe(0);
    }
    else if(BN.isBN(value))
    {
      // convert to an instance of type, which must behave like an Array
      value = value.toArrayLike(Buffer);
    }
    else if(value.toArray)
    {
      value = Buffer.from(value.toArray());
    }
    else
    {
      throw new Error("uitl toBuffer, invalid type.");
    }
  }
  return value;
}

/***************************************** buffer end *****************************************/

/**
 * Left Pads an Array or Buffer with leading zeros till it has length bytes or it truncates the beginning if it exceeds.
 * @param {Buffer|Array} msg the value to pad
 * @param {Number} length the number of bytes the output should be
 * @param {Boolean} [right=false] whether to start padding form the left or right
 * @return {Buffer}
 */
exports.setLength = function(msg, length, right) {
  const buf = Buffer.alloc(length);
  msg = exports.toBuffer(msg);

  if(right)
  {
    if(msg.length < length)
    {
      msg.copy(buf);
      return buf;
    }
    return msg.slice(0, length);
  }
  else
  {
    if(msg.length < length)
    {
      msg.copy(buf, length - msg.length);
      return buf;
    }
    return msg.slice(-length);
  }
}

/**
 * Converts a Buffer or Array to hex string
 * @param {Buffer|Array} value
 * @return {Array|String|null}
 */
exports.baToHexString = function(value)
{
  if(Buffer.isBuffer(value))
  {
    return "0x" + value.toString("hex");
  }
  else if(value instanceof Array) 
  {
    const array = [];
    for(let i = 0; i < value.length; i++)
    {
      array.push(exports.baToHexString(value[i]));
    }
    return array;
  }
  else
  {
    throw new Error("util baToHexString, invalid type.");
  }
}

/**
 * Defines properties on a Object. It make the assumption that underlying data is binary.
 * @param {Object} self the Object to define properties on
 * @param {Array} fields an array fields to define. Fields can contain:
 * * name - the name of the properties
 * * alias - the alias of the properties, note that property cant not be modifid by alias
 * * default - the default value
 * * length - the number of bytes the field can have
 * * allowLess - if the field can be less than the length
 * * allowEmpty - if the field can be null or undefined
 * @param {rlp serialize data|hex string|Object|Array} data data to be validated against the definitions
 */
exports.defineProperties = function(self, fields, data) {
  self.raw = [];
  self._fields = [];

  // attach the toHexString
  self.toHexString = function(label)
  {
    if(label)
    {
      const obj = {};
      self._fields.forEach(field => {
        obj[field] = "0x" + self[field].toString("hex");
      });
      return obj;
    }
    return exports.baToHexString(this.raw);
  }

  self.serialize = function()
  {
    return rlp.encode(self.raw);
  }

  fields.forEach((field, i) => {

    if(field.length <= 0)
    {
      throw new Error("util defineProperties, The field " + field.name + " property length can not be zero.");
    }

    self._fields.push(field.name);

    function getter()
    {
      return self.raw[i];
    }

    function setter(value)
    {
      // note!!! if value is a hex string, prefix zero will be deleted
      value = exports.toBuffer(value);

      if(value.toString("hex") === "00" && !field.allowZero)
      {
        throw new Error("util defineProperties, The field " + field.name + " can not be zero.");
      }

      // if value is zero, as zero hex string will be truncated, so value can be any byte length
      if(!field.allowZero)
      {
        if(field.allowLess)
        {
          assert(field.length >= value.length, "uitl defineProperties, The field " + field.name + " must not have more " + field.length + " bytes");
        }
        else
        {
          assert(field.length === value.length, "uitl defineProperties, The field " + field.name + " must have byte length of " + field.length);
        }
      }

      self.raw[i] = value;
    }

    Object.defineProperty(self, field.name, {
      enumerable: true,
      configurable: true,
      get: getter,
      set: setter
    });

    if (field.default) {
      self[field.name] = field.default;
    }

    // attach alias
    if (field.alias) {
      Object.defineProperty(self, field.alias, {
        enumerable: false,
        configurable: true,
        set: setter,
        get: getter
      })
    }
  });

  // if the constuctor is passed data
  if(data)
  {
    if(typeof data === "string")
    {
      data = Buffer.from(exports.stripHexPrefix(data), 'hex');
    }

    if(Buffer.isBuffer(data))
    {
      data = rlp.decode(data);
    }

    if(Array.isArray(data))
    {
      if(data.length > self._fields.length)
      {
        throw new Error('uitl defineProperties, wrong number of fields in data');
      }

      data.forEach((d, i) => {
        self[self._fields[i]] = exports.toBuffer(d);
      });
    }

    if(typeof data === "object") {
      const keys = Object.keys(data);

      fields.forEach((field) => {
        if(keys.indexOf(field.name) !== -1)
        {
          self[field.name] = data[field.name];
        }
        if(keys.indexOf(field.alias) !== -1)
        {
          self[field.alias] = data[field.alias];
        }
      });
    } 
  
    throw new Error('invalid data');
  }
}