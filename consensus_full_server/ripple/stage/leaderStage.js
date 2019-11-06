const { STAGE_STATE_FINISH } = require("../../constant");
const Stage = require("./stage");
const Base = require("../data/base");

const unlManager = process[Symbol.for("unlManager")];

class LeaderStage extends Stage {
  constructor({ name, expiration, threshould } = { threshould: unlManager.fullUnl.length }) {

    super({ name, expiration, threshould });
  }

  startTimer() {
    if (unlManager.fullUnl.length > 0) {

      this.timeout = setTimeout(() => {

        this.state = STAGE_STATE_FINISH;

        this.handler();
      }, this.expiration)

      return;
    }

    // adapted to single mode
    this.state = STAGE_STATE_FINISH;

    this.handler();
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