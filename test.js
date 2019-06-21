let a = [1, 2, 3, , 5]
console.log(a[3])

const { rlp } = require("./depends/utils");

const b = rlp.decode(rlp.encode(a))
console.log(b[3])