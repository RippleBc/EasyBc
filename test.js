const utils = require("./depends/utils");

const rlp = utils.rlp;

console.log(rlp.decode(Buffer.from([0xc0])))