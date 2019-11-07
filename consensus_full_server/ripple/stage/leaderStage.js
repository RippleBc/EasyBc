const { STAGE_STATE_FINISH } = require("../../constant");
const Stage = require("./stage");
const Base = require("../data/base");

const unlManager = process[Symbol.for("unlManager")];

class LeaderStage extends Stage {
  constructor({ name, expiration, threshould } = { threshould: unlManager.fullUnl.length }) {

    super({ name, expiration, threshould });
  }

  /**
   * 
   * @param {Base} candidate 
   */
  enterNextStage(candidate)
  {
    assert(candidate instanceof Base, `${this.name} LeaderStage, candidate should be an instance of Base, now is ${typeof candidate}`);

    if (this.finishedNodes.size >= unlManager.fullUnl.length 
      || this.finishedNodes.size > this.threshould) {
      this.state = STAGE_STATE_FINISH;

      clearTimeout(this.timeout);

      process.nextTick(() => {
        this.handler();
      });
    }
  }
}

module.exports = LeaderStage;