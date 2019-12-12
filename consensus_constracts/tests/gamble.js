import { BN, intToBuffer } from "../../depends/utils";
import { TX_TYPE_CREATE_CONSTRACT } from "../constant";

let MIN = 100;
let duration = 10 * 60 * 1000;


const BET = 1;
const DRAW = 2;

const STATE_PROCESSING = 1;
const STATE_FINISH = 2;

class Constract {
  constructor(state, beginTime, gambleResult, max) {
    if (args.length < 0) {
      return;
    }

    // state
    this.state = state;

    // begin time
    this.beginTime = beginTime;

    // gamble result
    this.gambleResult = new WeakMap();
    for (let [key, val] of gambleResult)
    {
      gambleResult.set(key, val);
    }

    //
    this.max = max;
  }

  async create() {
    // state
    this.raw[0] = STATE_PROCESSING;

    // begin time
    this.raw[1] = timestamp;

    // gamble result
    this.raw[2] = [];

    // max
    this.raw[3] = Buffer.alloc(0);
  }

  async run(commandId) {

    // check val
    if (new BN(tx.value).lt(new BN(MIN)))
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

        if (bufferToInt(commandId) === DRAW
          && new BN(timestamp).subn(this.beginTime).gtn(duration))
        {
          this.state = STATE_FINISH;

          //
          fromAccount.balance = new BN(fromAccount.balance).add(new BN(toAccount.balance)).toBuffer();

          toAccount.balance = 0;
        }

        this.serialize();

        return;
      }
    }

    if (bufferToInt(commandId) === BET
      && new BN(timestamp).subn(this.beginTime).lten(duration)) {
      gambleResult.set(from, tx.value);

      if (new BN(this.max).lt(new BN(tx.value)))
      {
        this.max = tx.value;
      }
    }

    this.serialize();
  }

  serialize() {
   this.raw = [
     this.state,
     this.beginTime,
     ...gambleResult,
     this.max
   ]
  }
}