const { STAGE_STATE_FINISH } = require("../constants");
const Stage = require("./stage");

const privateKey = process[Symbol.for("privateKey")];

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
      if (this.ripple.state === RIPPLE_STATE_CONSENSUS && !this.ripple.consensusCandidateDigest)
      {
        this.ripple.consensusCandidateDigest = candidateDetail.data;
        this.ripple.consensusCandidateDigest.sign(privateKey);
      }
      else if (this.ripple.state === RIPPLE_STATE_VIEW_CHANGE_FOR_CONSENSUS_FAIL)
      {
        this.ripple.consensusViewChange = candidateDetail.data;
        this.ripple.consensusViewChange.sign(privateKey);
      }
      else
      {
        logger.fatal(`${this.name} ConsensusStage enterNextStage, ripple state should be ${RIPPLE_STATE_CONSENSUS} or ${RIPPLE_STATE_VIEW_CHANGE_FOR_CONSENSUS_FAIL}, now is ${this.ripple.state}`);
      
        process.exit(1);
      }

      //
      this.state = STAGE_STATE_FINISH;

      clearTimeout(this.timer);
      this.timer = undefined;

      process.nextTick(() => {
        this.handler();
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