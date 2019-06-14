const Benchmark = require("benchmark");
const utils = require("../../depends/utils")
const { randomBytes } = require("crypto");
const { FormatResult, LoadingBar } = require("../utils");
const assert = require("assert");

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


/**
 * @param {String} num
 */
module.exports = num => {
  assert(typeof num === "number", `benchmark, num should be a Number, now is ${typeof num}`)

  console.log(`test content size ${num}`);

  const CONTENT = randomBytes(num);
  const HASHED_CONTENT = sha256(CONTENT);
  const ENCODED_CONTENT = rlp.encode([CONTENT]);
  const {r: R, s: S, v: V} = ecsign(HASHED_CONTENT, PRIVATE_KEY);

  const formatResult = new FormatResult(50);
  const loadBar = new LoadingBar();
  loadBar.start()

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
    formatResult.writeContent(event.target);
  })
  .on('complete', function() {
    loadBar.end();
    formatResult.printFormatedContent();

  })

  // run async
  .run({ 'async': true });
}