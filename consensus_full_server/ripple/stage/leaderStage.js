const Stage = require("./stage");
const Base = require("../data/base");
const assert = require("assert");

const unlManager = process[Symbol.for("unlManager")];

class LeaderStage extends Stage {
  constructor({ name, expiration, threshould } = { threshould: unlManager.unlFullSize }) {

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