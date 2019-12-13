const { randomBytes } = require("crypto");

const MIN = 100;
const DURATION = 10 * 60 * 1000;
const SERVICE_CHARGE = 500;
const PARTICIPANT_LIMIT = 500;

const BET = 1;
const DRAW = 2;

const STATE_PROCESSING = 1;
const STATE_FINISH = 2;

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
    for (let [key, val] of gambleResult)
    {
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
    this.gambleResult = [];

    // maxRandomNum
    this.maxRandomNum = Buffer.alloc(0);
  }

  async run(commandId) {

    // check val
    if (new BN(tx.value).lt(new BN(MIN)))
    {
      return;
    }

    // check state
    if (this.state === STATE_FINISH)
    {
      return;
    }

    // check participant limit
    if (PARTICIPANT_LIMIT >= this.gambleResult.keys().length) 
    {
      return;
    }

    //
    const from = tx.from;

    //
    for (let key of this.gambleResult.keys())
    {
      if (key.toString('hex') === from.toString('hex'))
      {

        // draw command and gamble has expired and dice is biggest and value is gte service charge
        if (bufferToInt(commandId) === DRAW
          && new BN(timestamp).subn(this.beginTime).gtn(DURATION)
          && new BN(this.gambleResult.get(key)).eq(new BN(this.maxRandomNum))
          && new BN(this.value).gten(SERVICE_CHARGE))
        {
          //
          this.state = STATE_FINISH;

          //
          fromAccount.balance = new BN(fromAccount.balance).add(new BN(toAccount.balance)).toBuffer();

          toAccount.balance = 0;
        }

        return;
      }
    }

    // command is bet and gamble has no expired
    if (bufferToInt(commandId) === BET
      && new BN(timestamp).subn(this.beginTime).lten(DURATION)
      && this.gambleResult.keys().length < PARTICIPANT_LIMIT) {

      // generate dice
      const dice = randomBytes(20)

      //
      this.gambleResult.set(from, dice);

      if (new BN(this.maxRandomNum).lt(new BN(dice)))
      {
        this.maxRandomNum = dice;
      }
    }
  }

  serialize() {
   this.raw = [
     this.state,
     this.beginTime,
     ...this.gambleResult.entries(),
     this.maxRandomNum
   ]
  }
}