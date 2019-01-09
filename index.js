var util = require("./utils");
const Buffer = require("safe-buffer").Buffer;

let privateKey = util.createPrivateKey();
let publicKey = util.privateToPublic(privateKey);

console.log(publicKey.toString("hex"));
console.log(privateKey.toString("hex"));