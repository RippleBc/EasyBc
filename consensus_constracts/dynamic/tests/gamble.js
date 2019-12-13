const { randomBytes } = require("crypto");

const MIN = 100;
const DURATION = 5 * 1000;
const SERVICE_CHARGE = 500;
const PARTICIPANT_LIMIT = 500;

const BET = 1;
const DRAW = 2;

const STATE_PROCESSING = 1;
const STATE_FINISH = 2;

const generateMapKey = (from) => {
  // padding nonce to 32 bytes
  const nonce = Buffer.alloc(32);
  fromAccountNonce.copy(nonce, 32 - fromAccountNonce.length);

  return Buffer.concat([from, nonce]);
}

const fetchAddressFromKey = (key) => {
  let from = key.slice(0, 20);

  return from;
}

class Constract {
  constructor(state, beginTime, gambleResult, maxRandomNum) {
    if (state === undefined) {
      //
      return;
    }

    // state
    this.state = state;

    // begin time
    this.beginTime = beginTime;

    // gamble result
    this.gambleResult = new Map();
    for (let [key, val] of gambleResult) {
      this.gambleResult.set(key, val);
    }

    //
    this.maxRandomNum = maxRandomNum;
  }

  async create() {
    // state
    this.state = STATE_PROCESSING;

    // begin time
    this.beginTime = timestamp;

    // gamble result
    this.gambleResult = new Map();

    // maxRandomNum
    this.maxRandomNum = Buffer.alloc(6);
  }

  async run(commandId) {
    // check val
    if (new BN(tx.value).ltn(MIN)) {
      return;
    }

    // check state
    if (this.state === STATE_FINISH) {
      return;
    }

    // check participant limit
    if (PARTICIPANT_LIMIT <= this.gambleResult.size) {
      return;
    }

    //
    const from = tx.from;

    switch (bufferToInt(commandId)) {
      case DRAW:
        {
          // should be expired
          if (new BN(timestamp).sub(new BN(this.beginTime)).ltn(DURATION)) {
            return;
          }

          // check service charge
          if (new BN(tx.value).ltn(SERVICE_CHARGE)) {
            return;
          }

          for (let key of this.gambleResult.keys()) {
            //
            if (fetchAddressFromKey(key).toString('hex') !== from.toString('hex')) {
              continue;
            }

            // check dice
            if (new BN(this.gambleResult.get(key)).lt(new BN(this.maxRandomNum))) {
              continue;
            }

            //
            this.state = STATE_FINISH;

            console.log(`run DRAW, reward: ${toAccountBalance.toString('hex')}, from: ${fetchAddressFromKey(key).toString('hex')}, maxRandomNum: ${this.maxRandomNum.toString('hex')}`);

            //
            sendTransaction(tx.to, fetchAddressFromKey(key), toAccountBalance);

            return;
          }
        }
        break;
      case BET:
        {
          // should not expired
          if (new BN(timestamp).sub(new BN(this.beginTime)).gtn(DURATION)) {
            return;
          }

          // shoud not reach limit
          if (this.gambleResult.size >= PARTICIPANT_LIMIT) {
            return;
          }

          // generate dice
          const dice = randomBytes(6);

          //
          this.gambleResult.set(generateMapKey(from), dice);

          //
          if (new BN(this.maxRandomNum).lt(new BN(dice))) {
            this.maxRandomNum = dice;
          }

          console.log(`run BET, dice: ${dice.toString('hex')}, from: ${from.toString('hex')}, maxRandomNum: ${this.maxRandomNum.toString('hex')}`)
        }
        break;
    }
  }

  serialize() {
    this.raw = [
      this.state,
      this.beginTime,
      [...this.gambleResult.entries()],
      this.maxRandomNum
    ];
  }
}