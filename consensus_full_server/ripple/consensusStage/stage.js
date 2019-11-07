const { STAGE_STATE_EMPTY, 
  CHEAT_REASON_INVALID_ADDRESS, 
  CHEAT_REASON_INVALID_SIG, 
  CHEAT_REASON_REPEAT_DATA_EXCHANGE,
  STAGE_STATE_FINISH } = require("../../constant");
const assert = require("assert");
const Base = require("../data/base");

const logger = process[Symbol.for("loggerConsensus")];

class Stage {
  constructor({ name, expiration, threshould })
  {
    this.name = name;
    this.expiration = expiration;
    this.threshould = threshould;

    this.state = STAGE_STATE_EMPTY;

    this.finishedNodes = new Set();
    this.candidates = [];

    this.cheatedNodes = [];
  }

  startTimer() {
    if (unlManager.fullUnl.length > 0) {

      this.timeout = setTimeout(() => {

        this.state = STAGE_STATE_FINISH;

        this.handler();

      }, this.expiration)

      return;
    }

    // switch to single mode
    this.state = STAGE_STATE_FINISH;

    this.handler();
  }

  /**
	 * @param {Base} candidate
	 * @param {String} address
	 */
  validateAndProcessExchangeData(candidate, address) {
    assert(candidate instanceof Base, `${this.name} ConsensusStage, candidate should be an instance of Base, now is ${typeof candidate}`);
    assert(typeof address === 'string', `${this.name} ConsensusStage, address should be a String, now is ${typeof address}`);

    // check if repeated recieve
    if (this.finishedNodes.has(address)) {
      logger.error(`${name} Sender ConsensusStage, repeated receive, address ${address}`);

      this.cheatedNodes.push({
        address: toString('hex'),
        reason: CHEAT_REASON_REPEAT_DATA_EXCHANGE
      });

      return;
    }

    // try to enter next stage
    this.enterNextStage(candidate);

    // add address
    this.finishedNodes.add(address);

    // check sig
    if (!candidate.validate()) {
      logger.error(`${this.name} ConsensusStage validate, address: ${address}, validate failed`);

      this.cheatedNodes.push({
        address: address,
        reason: CHEAT_REASON_INVALID_SIG
      });

      return;
    }

    // check address
    if (address !== candidate.from.toString("hex")) {
      logger.error(`${this.name} ConsensusStage validate, address should be ${address}, now is ${candidate.from.toString("hex")}`);

      this.cheatedNodes.push({
        address: address,
        reason: CHEAT_REASON_INVALID_ADDRESS
      });

      return;
    }

    this.candidates.push(candidate);
  }

  reset()
  {
    this.state = STAGE_STATE_EMPTY;

    this.finishedNodes.clear();
    this.candidates = [];

    this.cheatedNodes = [];

    if(this.timeout)
    {
      clearTimeout(this.timeout);
    }
  }
}

module.exports = Stage;