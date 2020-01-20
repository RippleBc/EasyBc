const Stage = require("./stage");
const Base = require("../data/base");
const assert = require("assert");
const { STAGE_STATE_FINISH, STAGE_FINISH_SUCCESS } = require("../constants");

const unlManager = process[Symbol.for("unlManager")];

class LeaderStage extends Stage {
  constructor({ name, expiration, threshould = () => unlManager.unlFullSize}) {

    super({ name, expiration, threshould });
  }

  /**
   * @param {Base} candidate 
   * @return {Boolean}
   */
  enterNextStage(candidate)
  {
    assert(candidate instanceof Base, `${this.name} LeaderStage, candidate should be an instance of Base, now is ${typeof candidate}`);

    if (this.finishedNodes.size >= this.threshould()) {
      this.state = STAGE_STATE_FINISH;

      clearTimeout(this.timer);
      this.timer = undefined;

      process.nextTick(() => {
        this.handler(STAGE_FINISH_SUCCESS);
      });
      
      return true;
    }

    return false;
  }
}

module.exports = LeaderStage;