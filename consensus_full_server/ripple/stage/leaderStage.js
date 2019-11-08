const { STAGE_STATE_FINISH,
  STAGE_FINISH_FOR_ALL_NODES_RETURN,
  STAGE_FINISH_SUCCESS } = require("../constants");
const Stage = require("./stage");
const Base = require("../data/base");

const unlManager = process[Symbol.for("unlManager")];

class LeaderStage extends Stage {
  constructor({ name, expiration, threshould } = { threshould: unlManager.fullUnl.length }) {

    super({ name, expiration, threshould });
  }

  /**
   * @param {Base} candidate 
   * @return {Boolean}
   */
  enterNextStage(candidate)
  {
    assert(candidate instanceof Base, `${this.name} LeaderStage, candidate should be an instance of Base, now is ${typeof candidate}`);

    return false;
  }
}

module.exports = LeaderStage;