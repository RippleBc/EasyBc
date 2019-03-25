const createKeccakHash = require("keccak");
const secp256k1 = require("secp256k1");
const assert = require("assert");
const { randomBytes } = require("crypto");
const path = require("path");
const fs = require("fs");

const Buffer = exports.Buffer = require("safe-buffer").Buffer;
const rlp = exports.rlp = require("rlp");
const BN = exports.BN = require("bn.js");

exports.stripHexPrefix = require("strip-hex-prefix");

const SANITIZED_PUBLIC_KEY = 64;
const UNSANITIZED_PUBLIC_KEY = 65;
const PREFIX_OF_UNSANITIZED_PUBLIC_KEY = 0x04;

/***************************************** const begin *****************************************/
/**
 * Keccak-256 hash of null (a String)
 * @var {String} KECCAK256_NULL_S
 */
exports.KECCAK256_NULL_S = "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
exports.SHA3_NULL_S = exports.KECCAK256_NULL_S;

/**
 * Keccak-256 hash of null (a Buffer)
 * @var {Buffer} KECCAK256_NULL
 */
exports.KECCAK256_NULL = Buffer.from(exports.KECCAK256_NULL_S, "hex");
exports.SHA3_NULL = exports.KECCAK256_NULL;

/**
 * Keccak-256 of an RLP of an empty array (a String)
 * @var {String} KECCAK256_RLP_ARRAY_S
 */
exports.KECCAK256_RLP_ARRAY_S = "1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347";
exports.SHA3_RLP_ARRAY_S = exports.KECCAK256_RLP_ARRAY_S;

/**
 * Keccak-256 of an RLP of an empty array (a Buffer)
 * @var {Buffer} KECCAK256_RLP_ARRAY
 */
exports.KECCAK256_RLP_ARRAY = Buffer.from(exports.KECCAK256_RLP_ARRAY_S, "hex");
exports.SHA3_RLP_ARRAY = exports.KECCAK256_RLP_ARRAY;

/**
 * Keccak-256 hash of the RLP of null  (a String)
 * @var {String} KECCAK256_RLP_S
 */
exports.KECCAK256_RLP_S = "56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421";
exports.SHA3_RLP_S = exports.KECCAK256_RLP_S;

/**
 * Keccak-256 hash of the RLP of null (a Buffer)
 * @var {Buffer} KECCAK256_RLP
 */
exports.KECCAK256_RLP = Buffer.from(exports.KECCAK256_RLP_S, "hex");
exports.SHA3_RLP = exports.KECCAK256_RLP;

/***************************************** const end *****************************************/

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
  while(!secp256k1.privateKeyVerify(privateKey));

  return privateKey;
}

/**
 * Verify an ECDSA privateKey
 * @param {Buffer} privateKey
 * @return {Boolean}
 */
exports.isValidPrivate = function(privateKey)
{
  assert(Buffer.isBuffer(privateKey), `utils isValidPrivate, privateKey should be an Buffer, now is ${typeof privateKey}`);

  return secp256k1.privateKeyVerify(privateKey);
}

/**
 * Verify an ECDSA publicKey
 * @param {Buffer} publicKey
 * @return {Boolean}
 */
exports.isValidPublic = function(publicKey)
{
  assert(Buffer.isBuffer(publicKey), `utils isValidPublic, publicKey should be an Buffer, now is ${typeof publicKey}`);

  if(publicKey.length !== SANITIZED_PUBLIC_KEY && publicKey.length !== UNSANITIZED_PUBLIC_KEY)
  {
    throw Error(`utils isValidPublic, publicKey should be sanitized or unsanitized, it's length should be ${SANITIZED_PUBLIC_KEY} or ${UNSANITIZED_PUBLIC_KEY}`);
  }

  // convert publicKey to unsanitized
  if(publicKey.length === SANITIZED_PUBLIC_KEY)
  {
    publicKey = Buffer.concat([Buffer.from([PREFIX_OF_UNSANITIZED_PUBLIC_KEY]), publicKey]);
  }

  // check valid
  return secp256k1.publicKeyVerify(publicKey);
}

/**
 * Convert a publicKey to address
 * @param {Buffer} publicKey - an sanitized publicKey
 * @return {Buffer}
 */
exports.publicToAddress = function(publicKey)
{
  assert(Buffer.isBuffer(publicKey), `utils publicToAddress, publicToAddress should be an Buffer, now is ${typeof publicKey}`);

  if(publicKey.length !== SANITIZED_PUBLIC_KEY && publicKey.length !== UNSANITIZED_PUBLIC_KEY)
  {
    throw Error(`utils publicToAddress, publicKey should be sanitized or unsanitized, it's length should be ${SANITIZED_PUBLIC_KEY} or ${UNSANITIZED_PUBLIC_KEY}, now is ${publicKey.length}`);
  }

  // Convert to sanitized publicKey.
  if(publicKey.length === UNSANITIZED_PUBLIC_KEY)
  {
    publicKey = publicKey.slice(1);
  }

  // Only take the lower 20 bytes of the hash
  return exports.keccak(publicKey).slice(-20);
}

/**
 * Compute an uncompressed sanitzied publickKey
 * @param {Buffer} privateKey
 * @return {Buffer}
 */
exports.privateToPublic = function(privateKey)
{
  assert(Buffer.isBuffer(privateKey), `utils privateToPublic, privateKey should be an Buffer, now is ${typeof privateKey}`);

  return secp256k1.publicKeyCreate(privateKey, false).slice(1);
}

/**
 * ECDSA sign
 * @param {Buffer} msgHash
 * @param {Buffer} privateKey
 * @return {Object}
 */
exports.ecsign = function(msgHash, privateKey)
{
  assert(Buffer.isBuffer(msgHash), `utils ecsign, msgHash should be an Buffer, now is ${typeof msgHash}`);
  assert(Buffer.isBuffer(privateKey), `utils ecsign, privateKey should be an Buffer, now is ${typeof privateKey}`);

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
 * @param {Buffer} r
 * @param {Buffer} s
 * @param {Buffer} publicKey
 * @return {Boolean}
 */
exports.ecverify = function(msgHash, r, s, publicKey)
{
  assert(Buffer.isBuffer(msgHash), `utils ecverify, msgHash should be an Buffer, now is ${typeof msgHash}`);
  assert(Buffer.isBuffer(r), `utils ecverify, r should be an Buffer, now is ${typeof r}`);
  assert(Buffer.isBuffer(s), `utils ecverify, s should be an Buffer, now is ${typeof s}`);
  assert(Buffer.isBuffer(publicKey), `utils ecverify, publicKey should be an Buffer, now is ${typeof publicKey}`);

  if(!exports.isValidPublic(publicKey))
  {
    throw new Error(`utils ecsign, publickey is invalid ${publicKey.toString("hex")}.`);
  }

  // compute compressed publicKey
  if(publicKey.length === SANITIZED_PUBLIC_KEY)
  {
    publicKey = Buffer.concat([Buffer.from([PREFIX_OF_UNSANITIZED_PUBLIC_KEY]), publicKey]);
  }
  publicKey = secp256k1.publicKeyConvert(publicKey, true);

  // compute sig
  const sig = Buffer.concat([r, s]);

  return secp256k1.verify(msgHash, sig, publicKey);
}

/**
 * ECDSA publicKey recovery from signature
 * @param {Buffer} msgHash
 * @param {Number} v
 * @param {Buffer} r
 * @param {Buffer} s
 * @return {Buffer}
 */
exports.ecrecover = function(msgHash, v, r, s)
{
  assert(Buffer.isBuffer(msgHash), `utils ecrecover, msgHash should be an Buffer, now is ${typeof msgHash}`);
  assert(typeof v === "number", `utils ecrecover, v should be a Number, now is ${typeof v}`);
  assert(Buffer.isBuffer(r), `utils ecrecover, r should be an Buffer, now is ${typeof r}`);
  assert(Buffer.isBuffer(s), `utils ecrecover, s should be an Buffer, now is ${typeof s}`);

  // left pads with zero
  r = exports.setLength(r, 32);
  s = exports.setLength(s, 32);

  // compute signature and recovery
  const signature = Buffer.concat([r, s], 64);
  const recovery = v - 27;
  if (recovery !== 0 && recovery !== 1)
  {
    throw new Error(`utils ecrecover, invalid recovery, v should be 27 or 28, now is ${typeof recovery}`);
  }

  // compute an compressed publicKey
  const publickKey = secp256k1.recover(msgHash, signature, recovery);

  return secp256k1.publicKeyConvert(publickKey, false).slice(1);
}

/***************************************** ecc end *****************************************/

/***************************************** sha-3 begin *****************************************/
/**
 * Creates Keccak hash of the input
 * @param {Buffer} value - the input data
 * @param {Number} bits - the Keccak width
 * @return {Buffer}
 */
exports.sha3 = exports.keccak = function(value, bits = 256)
{
  assert(Buffer.isBuffer(value), `utils keccak, value should be an Buffer, now is ${typeof value}`);
  assert(typeof bits === "number", `utils keccak, bits should be a Number, now is ${typeof bits}`);

  return createKeccakHash(`keccak${bits}`).update(value).digest();
}

/**
 * Creates Keccak-256 hash of the input, alias for keccak(value, 256)
 * @param {Buffer} value - the input data
 * @return {Buffer}
 */
exports.sha256 = exports.keccak256 = function(value)
{
  assert(Buffer.isBuffer(value), `utils keccak256, value should be an Buffer, now is ${typeof value}`);

  return exports.keccak(value);
}

/***************************************** sha-3 end *****************************************/

/***************************************** buffer begin *****************************************/
/**
 * Pads a String to have an even length
 * @param {String} value
 * @return {String}
 */
exports.padToEven = function(value)
{
  assert(typeof value === "string", `utils padToEven, value should be a String, now is ${typeof value}`);

  if(value.length % 2)
  {
    value = `0${value}`;
  }

  return value;
}

/**
 * Check if string is hex string
 * @param {String} value
 * @returns {Boolean}
 */
exports.isHexString = function(value)
{
  assert(typeof value === "string", `utils isHexString, value should be a String, now is ${typeof value}`);

  if(!value.match(/^0x[0-9A-Fa-f]*$/))
  {
    return false;
  }

  return true;
}

/**
 * Converts a Number into a hex String
 * @param {Number} value
 * @return {String}
 */
exports.intToHex = function(value)
{
  assert(typeof value === "number", `utils intToHex, value should be a Number, now is ${typeof value}`);

  var hex = value.toString(16);

  return `0x${hex}`;
}

/**
 * Converts a Number to a Buffer
 * @param {Number} value
 * @return {Buffer}
 */
exports.intToBuffer = function(value)
{
  assert(typeof value === "number", `utils intToBuffer, value should be a Number, now is ${typeof value}`);

  const hexString = exports.intToHex(value);

  return new Buffer(exports.padToEven(hexString.slice(2)), "hex");
}

/**
 * Converts a Buffer to a Number
 * @param {Buffer} value
 * @throws - if the input number exceeds 53 bits
 */
exports.bufferToInt = function(value)
{
  assert(Buffer.isBuffer(value), `utils bufferToInt, value should be an Buffer, now is ${typeof value}`);

  return (new BN(value)).toNumber();
}

/**
 * Attempts to turn a value into a Buffer. As input it supports Buffer, String, Number, null/undefined, BN and other objects with a toArray() method
 * @param {Buffer|Array|String|Number|BN} value
 */
exports.toBuffer = function(value)
{
  if(Buffer.isBuffer(value))
  {
    return value;
  }

  if(Array.isArray(value))
  {
    value = Buffer.from(value);
  } 
  else if(typeof value === "string")
  {
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
  else if(BN.isBN(value))
  {
    value = value.toArrayLike(Buffer);
  }
  else if(value.toArray)
  {
    value = Buffer.from(value.toArray());
  }
  else
  {
    throw new Error(`uitl toBuffer, value should be Buffer or Array or String or Number or BN or Object which have a toArray method, now is ${typeof value}.`);
  }

  return value;
}

/***************************************** buffer end *****************************************/

/**
 * Left Pads an Array or Buffer with leading zeros till it has length bytes or it truncates the beginning if it exceeds
 * @param {Buffer} value
 * @param {Number} length - the number of bytes the output should be
 * @param {Boolean} right - whether to start padding form the left or right
 * @return {Buffer}
 */
exports.setLength = function(value, length, right = false) {
  assert(Buffer.isBuffer(value), `utils setLength, value should be an Buffer, now is ${typeof value}`);
  assert(typeof length === "number", `utils setLength, length should be an Buffer, now is ${typeof length}`);
  assert(typeof right === "boolean", `utils setLength, right should be an Buffer, now is ${typeof right}`);

  const buf = Buffer.alloc(length);

  if(right)
  {
    if(value.length < length)
    {
      value.copy(buf);
      return buf;
    }
    return value.slice(0, length);
  }
 
  if(value.length < length)
  {
    value.copy(buf, length - value.length);
    return buf;
  }
  return value.slice(-length);

}

/**
 * Converts an Buffer or Array to hex string
 * @param {Buffer|Array} value
 * @return {String|Array}
 */
exports.baToHexString = function(value)
{
  assert(Buffer.isBuffer(value) || Array.isArray(value), `utils baToHexString, value should be an Buffer or Array, now is ${typeof value}`);

  if(Buffer.isBuffer(value))
  {
    return "0x" + value.toString("hex");
  }
 
  const array = [];
  for(let i = 0; i < value.length; i++)
  {
    array.push(exports.baToHexString(value[i]));
  }
  return array;
}

/**
 * Defines properties on a Object. It make the assumption that underlying data is binary.
 * @param {Object} self - the Object to define properties on
 * @param {Array} fields - an array fields to define. Fields can contain:
 * @prop name - the name of the properties
 * @prop alias - the alias of the properties, note that property can not be modifid by alias
 * @prop default - the default value
 * @prop length - the number of bytes
 * @prop allowLess - if the field can be less than the length
 * @prop allowZero - if the field can be zero 
 * @param {String|Buffer|Array|Object} data.
 */
exports.defineProperties = function(self, fields, data)
{
  assert(typeof self === "object", `utils defineProperties, self should be an Object, now is ${typeof self}`);
  assert(Array.isArray(fields), `utils defineProperties, fields should be an Array, now is ${typeof fields}`);
  assert(typeof data === "string" || Buffer.isBuffer(data) || Array.isArray(data) || typeof data === "object", `utils defineProperties, data should be String or Buffer or Array or Object, now is ${typeof data}`);

  // Buffer Array
  self.raw = [];

  // String Array
  self._fields = [];

  // attach the toJSON
  self.toJSON = function()
  {
    const obj = {};
    self._fields.forEach(field => {
      obj[field] = `0x${self[field].toString("hex")}`;
    });
    return obj;
  }

  // attach the serialize
  self.serialize = function()
  {
    return rlp.encode(self.raw);
  }

  fields.forEach((field, i) => {

    self._fields.push(field.name);

    function getter()
    {
      return self.raw[i];
    }

    function setter(value)
    {
      value = exports.toBuffer(value);

      if(value.toString("hex") === "" && !field.allowZero)
      {
        throw new Error(`util defineProperties, field ${field.name} can not be zero.`);
      }

      if(field.length)
      {
        if(field.allowLess)
        {
          assert(field.length >= value.length, `util defineProperties, field ${field.name}, Buffer value length should be lower than ${field.length}, now it's length is ${value.length}`)
        }
        else
        {
          assert(field.length === value.length, `util defineProperties, field ${field.name}, Buffer value length should be ${field.length}, now it's length is ${value.length}`)
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
    if(field.default)
    {
      self[field.name] = field.default;
    }

    if(field.alias)
    {
      Object.defineProperty(self, field.alias, {
        enumerable: false,
        configurable: true,
        get: getter
      });
    }
  });

  if(data)
  {
    if(typeof data === "string" && exports.isHexString(data))
    {
      data = Buffer.from(exports.stripHexPrefix(data), "hex");
    }

    if(Buffer.isBuffer(data))
    {
      data = rlp.decode(data);
    }

    if(Array.isArray(data))
    {
      assert(data.length <= self._fields.length, `uitl defineProperties, data length should lower than ${self._fields.length}, now it's length is ${data.length}`);

      data.forEach((value, index) => {
        self[self._fields[index]] = exports.toBuffer(value);
      });
    }
    else if(typeof data === "object")
    {
      const keys = Object.keys(data);

      fields.forEach(field => {

        if(keys.indexOf(field.name) !== -1 || keys.indexOf(field.alias) !== -1)
        {
          self[field.name || field.alias] = data[field.name || field.alias];
        }
      });
    }
    else
    {
      throw new Error(`util defineProperties, data type should be String or Buffer or Array or Object, now is ${typeof data}`);
    }
  }
}

/**
 * Delete files recursively
 * @param {String} path - absolute path of the dir
 */
exports.delDir = function(path)
{
  var files = [];
  if(fs.existsSync(path))
  {
    files = fs.readdirSync(path);
    files.forEach(function(file, index)
    {
      var curPath = `${path}/${file}`;
      if(fs.statSync(curPath).isDirectory())
      { 
        // recursive
        exports.delDir(curPath);
      } 
      else
      { 
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};