const utils = require("./depends/utils");

const Buffer = utils.Buffer;

let a = Buffer.alloc(100);

console.log("aaaa: ", a.toString("hex"));