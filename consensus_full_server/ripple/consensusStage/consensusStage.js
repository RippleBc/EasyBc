const { STAGE_STATE_FINISH } = require("../../constant");
const Stage = require("./stage");

const unlManager = process[Symbol.for("unlManager")];
const privateKey = process[Symbol.for("privateKey")];

class ConsensusStage extends Stage {
  constructor({ name, expiration, threshould } = { threshould: unlManager.threshould}) {

    super({ name, expiration, threshould});

    this.trimedCandidates = new Map();
  }

  /**
   * 
   * @param {Base} candidate 
   */
  enterNextStage(candidate) {
    assert(candidate instanceof Base, `${this.name} ConsensusStage, candidate should be an instance of Base, now is ${typeof candidate}`);

    //
    const candidateHash = candidate.hash(false).toString('hex');
    let candidateDetail = this.trimedCandidates.get(candidateHash);
    if (candidateDetail)
    {
      candidateDetail.count += 1;
    }
    else
    {
      candidateDetail.data = candidate;
      candidateDetail.count = 1;
    }
    this.trimedCandidates.set(candidateHash, candidateDetail);

    //
    if (candidateDetail.count > this.threshould) {
      if (!this.ripple.consensusCandidateDigest)
      {
        this.ripple.consensusCandidateDigest = candidateDetail.data;
        this.ripple.consensusCandidateDigest.sign(privateKey);
      }

      //
      this.state = STAGE_STATE_FINISH;

      clearTimeout(this.timeout);

      process.nextTick(() => {
        this.handler();
      });

      return;
    }

    if (this.finishedNodes.size >= unlManager.fullUnl.length) {
      this.state = STAGE_STATE_FINISH;

      clearTimeout(this.timeout);

      process.nextTick(() => {
        this.handler()
      })
    }
  }

  reset()
  {
    super.reset();

    this.trimedCandidates.clear();
  }
}

module.exports = ConsensusStage;