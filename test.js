const utils = require("./depends/utils");

const Buffer = utils.Buffer;

let a = Buffer.from("01", "hex");

console.log("aaaa: ", a.toString("hex"));