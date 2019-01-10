const process = require("process")

process.on("uncaughtException", function (err) {
    console.error("An uncaught error occurred!");
    console.error(err.stack);
})

var util = require("./utils");
const Buffer = require("safe-buffer").Buffer;

let privateKey = util.toBuffer("0xb2b7c064bec5dc347b06b12bf85c32ace7335464a9a8ace7a88a992b8c7cf392");
let publicKey = util.toBuffer("0x4a3db7e45e3287482fc59bee5d46e2bde115c67f90a4df60a3ddb91b77abaf44c32438b17d4beeed39c25f2c79d0818b160b205224ebcaddaab021520cc1585f");

console.log("privateKey: " + privateKey.toString("hex"));
console.log("publicKey: " + publicKey.toString("hex"));

let textHash = util.keccak("fadsffljzvomawpo[jfsmjv[pawjfijnpzs'mv]awjfma'vmzskcvpjqgpmadf");
let sig = util.ecsign(textHash, privateKey);
console.log("sig: " + sig.toString("hex"));

console.log("result: " + util.ecverify(textHash, sig, publicKey));
