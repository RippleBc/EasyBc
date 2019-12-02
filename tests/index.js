const Transaction = require("../depends/transaction");
const { randomBytes } = require("crypto");

const nodesDetail = {
    "5a8fbde736795f7ef2ebff7cda09d8133da34d0b": "bfd549bfbbb41498b290bfdbefc1810aacf83463ba949569975220b3ceaaa1e0",
    "68ecab823675efa71e2edbe26a56b7a0d765dcde": "e29f99d13a92f788e46cec235ffbde9e64360bd1bd9e68e18ecac2e433fd6fce",
    "a20e4e1f76c64d8ba70237df08e15dfeb4c5f0f1": "a8ae1cedfe4cde02f45df6cf684a5612f59e110b29bbbeeec5e5886e6d2a6c0c",
    "059f8dc90879230fa7d51b6177b91d75c12bde4e": "c579cce6ddb05ea154369a4bbe5d56a2ecd4f94916207751541a204bca6c608f",
    "924ee9ba3f1a671d4cece8b6178fb66a19cf04a7": "f71f8d9325f7786036fcb62282684beb1243a6001efa28552f8b74ed180793fc"
}

// init a random tx
const tx = new Transaction({
    nonce: randomBytes(1),
    timestamp: Date.now(),
    to: randomBytes(20),
    value: randomBytes(32)
});
tx.sign(Buffer.from("bfd549bfbbb41498b290bfdbefc1810aacf83463ba949569975220b3ceaaa1e0", "hex"));

console.log(tx.from.toString('hex'))
console.log(tx.v.toString('hex'))
console.log(tx.r.toString('hex'))
console.log(tx.s.toString('hex'))
console.log(tx.validate())

// from is an inner var, if exists, will not be changed
tx.sign(Buffer.from("e29f99d13a92f788e46cec235ffbde9e64360bd1bd9e68e18ecac2e433fd6fce", "hex"));
console.log(tx.from.toString('hex'))
console.log(tx.v.toString('hex'))
console.log(tx.r.toString('hex'))
console.log(tx.s.toString('hex'))
console.log(tx.validate())