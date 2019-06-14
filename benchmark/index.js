const Benchmark = require("benchmark");
const utils = require("../depends/utils")
const { randomBytes } = require("crypto");

const Buffer = utils.Buffer;
const rlp = utils.rlp;
const sha256 = utils.sha256;
const ecsign = utils.ecsign;
const ecverify = utils.ecverify;
const ecrecover = utils.ecrecover;

const createPrivateKey = utils.createPrivateKey;
const privateToPublic = utils.privateToPublic;
const publicToAddress = utils.publicToAddress;

const PRIVATE_KEY = Buffer.from("7d4d01cae0cc51fcae5aff8b108e5fd6de5fdd024185f6569cd5c50f07deb493", "hex")
const PUBLIC_KEY = privateToPublic(PRIVATE_KEY);
const ADDRESS = publicToAddress(PUBLIC_KEY);

const CONTENT = randomBytes(250);
const HASHED_CONTENT = sha256(CONTENT);
const ENCODED_CONTENT = rlp.encode([CONTENT]);
const {r: R, s: S, v: V} = ecsign(HASHED_CONTENT, PRIVATE_KEY);


// init benchmark suit
const suite = new Benchmark.Suite;
//
suite.add('hash', function() {
  sha256(CONTENT);
})
.add('encode', function() {
  rlp.encode([CONTENT]);
})
.add('decode', function(event) {
  rlp.decode(ENCODED_CONTENT);
})
.add('sign', function() {
  ecsign(HASHED_CONTENT, PRIVATE_KEY);
})
.add('verify', function() {
  ecverify(HASHED_CONTENT, R, S, PUBLIC_KEY);
})
.add('recover', function() {
  ecrecover(HASHED_CONTENT, V, R, S);
})

// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})

// run async
.run({ 'async': true });