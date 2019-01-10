const util = require("../../utils");
const assert = require("assert");
const Buffer = require("safe-buffer").Buffer;

let textHash = util.keccak("fadsffljzvomawpo[jfsmjv[pawjfijnpzs'mv]awjfma'vmzskcvpjqgpmadf");

let privateKey = util.toBuffer("0xa2b7c064bec5dc347b06b12bf85c32ace7335464a9a8ace7a88a992b8c7cf392");
let publicKey = util.toBuffer("0x4a3db7e45e3287482fc59bee5d46e2bde115c67f90a4df60a3ddb91b77abaf44c32438b17d4beeed39c25f2c79d0818b160b205224ebcaddaab021520cc1585f");

let sig = util.ecsign(textHash, privateKey);

assert(util.ecrecover(textHash, sig.v, sig.r, sig.s).toString("hex") !== publicKey.toString("hex"), "ecrecover error.");

assert(util.ecverify(textHash, sig, publicKey) === false);

privateKey = util.createPrivateKey();
publicKey = util.privateToPublic(privateKey);

sig = util.ecsign(textHash, privateKey);

assert(util.ecrecover(textHash, sig.v, sig.r, sig.s).toString("hex") === publicKey.toString("hex"), "ecrecover error.");

assert(util.ecverify(textHash, sig, publicKey) === true);

console.log("test ok!!!");