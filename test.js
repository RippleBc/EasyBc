const utils = require("./depends/utils");

const sha256 = utils.sha256;
const Buffer = utils.Buffer;

let a = Buffer.alloc(100);

console.log("aaaa: ", a.toString("hex"));

console.log(sha256(Buffer.from("!@#$%^walker8383621")).toString("hex"));