const { STAGE_STATE_FINISH, STAGE_FINISH_SUCCESS } = require("../constants");
const Stage = require("./stage");
const assert = require("assert");
const Base = require("../data/base");

class ConsensusStage extends Stage {
  constructor({ name, expiration, threshould } = { threshould: this.ripple.threshould }) {

    super({ name, expiration, threshould});

    this.trimedCandidates = new Map();
  }

  /**
   * @param {Base} candidate 
   * @return {Boolean}
   */
  enterNextStage(candidate) {
    assert(candidate instanceof Base, `${this.name} ConsensusStage, candidate should be an instance of Base, now is ${typeof candidate}`);

    // update map
    const candidateHash = candidate.hash(false).toString('hex');
    let candidateDetail = this.trimedCandidates.get(candidateHash);
    if (candidateDetail)
    {
      candidateDetail.count += 1;
    }
    else
    {
      candidateDetail = {
        data: candidate,
        count: 1
      }
      
    }
    this.trimedCandidates.set(candidateHash, candidateDetail);

    // 
    if (candidateDetail.count >= this.threshould) {
      //
      this.state = STAGE_STATE_FINISH;

      clearTimeout(this.timer);
      this.timer = undefined;

      process.nextTick(() => {
        this.handler(STAGE_FINISH_SUCCESS, candidateDetail.data);
      });

      return true;
    }

    return false;
  }

  reset()
  {
    super.reset();

    this.trimedCandidates.clear();
  }
}

module.exports = ConsensusStage;