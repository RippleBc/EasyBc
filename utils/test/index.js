const util = require("../../utils");
const assert = require("assert");
const Buffer = require("safe-buffer").Buffer;

const BN = util.BN;

let textHash = util.keccak("fadsffljzvomawpo[jfsmjv[pawjfijnpzs'mv]awjfma'vmzskcvpjqgpmadf");

let privateKey = util.toBuffer("0xa2b7c064bec5dc347b06b12bf85c32ace7335464a9a8ace7a88a992b8c7cf392");
assert(util.isValidPrivate(privateKey) === true, "err");
let publicKey = util.toBuffer("0x4a3db7e45e3287482fc59bee5d46e2bde115c67f90a4df60a3ddb91b77abaf44c32438b17d4beeed39c25f2c79d0818b160b205224ebcaddaab021520cc1585f");
let sig = util.ecsign(textHash, privateKey);

assert(util.ecrecover(textHash, sig.v, sig.r, sig.s).toString("hex") !== publicKey.toString("hex"), "ecrecover error.");

assert(util.ecverify(textHash, sig.r, sig.s, publicKey) === false);

privateKey = util.createPrivateKey();
publicKey = util.privateToPublic(privateKey);

sig = util.ecsign(textHash, privateKey);

assert(util.ecrecover(textHash, sig.v, sig.r, sig.s).toString("hex") === publicKey.toString("hex"), "ecrecover error.");

assert(util.ecverify(textHash, sig.r, sig.s, publicKey) === true);

let a = util.intToBuffer(255);
let b = util.toBuffer(new BN(a));
let c = util.bufferToInt(b);

assert(c === 255);

//
privateKey = util.toBuffer("0xa2b7c064bec5dc347b06b12bf85c32ace7335464a9a8ace7a88a992b8c7cf392");
assert(util.isValidPrivate(privateKey) === true, "err");
sig = util.ecsign(textHash, privateKey);
assert("d6c58408a883c4e0b3d34e62f1bc5abe15cfe320d29c2d8ecf460aa825c1a7a8e47f97caa822934542b0b75cc317fa856fd8902bf3d1eb1352c719ee3e7fe369" === util.privateToPublic(privateKey).toString("hex"), "err");
assert("d6c58408a883c4e0b3d34e62f1bc5abe15cfe320d29c2d8ecf460aa825c1a7a8e47f97caa822934542b0b75cc317fa856fd8902bf3d1eb1352c719ee3e7fe369" === util.ecrecover(textHash, sig.v, sig.r, sig.s).toString("hex"), "err");

textHash = util.keccak("fadsffljzvomawpo[jfsmjv[pawjfijnpzs'mv]awjfma'vmzskcvpjqgpmaem");
assert(util.isValidPrivate(privateKey) === true, "err");
sig = util.ecsign(textHash, privateKey);
assert("d6c58408a883c4e0b3d34e62f1bc5abe15cfe320d29c2d8ecf460aa825c1a7a8e47f97caa822934542b0b75cc317fa856fd8902bf3d1eb1352c719ee3e7fe369" === util.privateToPublic(privateKey).toString("hex"), "err");
assert("d6c58408a883c4e0b3d34e62f1bc5abe15cfe320d29c2d8ecf460aa825c1a7a8e47f97caa822934542b0b75cc317fa856fd8902bf3d1eb1352c719ee3e7fe369" === util.ecrecover(textHash, sig.v, sig.r, sig.s).toString("hex"), "err");

console.log("test ok!!!");