const { STAGE_STATE_EMPTY, 
  CHEAT_REASON_INVALID_ADDRESS, 
  CHEAT_REASON_INVALID_SIG, 
  CHEAT_REASON_REPEAT_DATA_EXCHANGE,
  STAGE_STATE_FINISH,
  STAGE_FINISH_FOR_TIMEOUT,
  STAGE_FINISH_FOR_ALL_NODES_RETURN } = require("../constants");
const assert = require("assert");
const Base = require("../data/base");

const logger = process[Symbol.for("loggerConsensus")];
const unlManager = process[Symbol.for("unlManager")];

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
    this.timer = setTimeout(() => {

      this.state = STAGE_STATE_FINISH;

      this.timer = undefined;

      this.handler(STAGE_FINISH_FOR_TIMEOUT);

    }, this.expiration)
  }

  /**
	 * @param {Base} candidate
	 * @param {String} address
	 */
  validateAndProcessExchangeData(candidate, address) {
    assert(candidate instanceof Base, `${this.name} Stage, candidate should be an instance of Base, now is ${typeof candidate}`);
    assert(typeof address === 'string', `${this.name} Stage, address should be a String, now is ${typeof address}`);

    // check if repeated recieve
    if (this.finishedNodes.has(address)) {
      logger.error(`${name} Stage, repeated receive, address ${address}`);

      this.cheatedNodes.push({
        address: toString('hex'),
        reason: CHEAT_REASON_REPEAT_DATA_EXCHANGE
      });

      return;
    }

    // record received address
    this.finishedNodes.add(address);

    //
    const candidateValidateResult = candidate.validate();
    const addressValidateResult = (address === candidate.from.toString("hex"));
    
    // check sig
    if (!candidateValidateResult) {
      logger.error(`${this.name} Stage validate, address: ${address}, validate failed`);

      this.cheatedNodes.push({
        address: address,
        reason: CHEAT_REASON_INVALID_SIG
      });
    }

    // check if msg address is correspond with connect address
    if (!addressValidateResult)
    {
      logger.error(`${this.name} Stage validate, address should be ${address}, now is ${candidate.from.toString("hex")}`);

      this.cheatedNodes.push({
        address: address,
        reason: CHEAT_REASON_INVALID_ADDRESS
      });
    }

    // candidate is valid
    if (candidateValidateResult && addressValidateResult) {
      this.candidates.push(candidate);

      if (this.enterNextStage(candidate))
      {
        return;
      }
    }

    // check if every node's respond has received
    if (this.finishedNodes.size >= unlManager.unlFullSize) {
      this.state = STAGE_STATE_FINISH;

      clearTimeout(this.timer);
      this.timer = undefined;

      this.handler(STAGE_FINISH_FOR_ALL_NODES_RETURN);
    }
  }

  reset()
  {
    this.state = STAGE_STATE_EMPTY;

    this.finishedNodes.clear();
    this.candidates = [];

    this.cheatedNodes = [];

    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
}

module.exports = Stage;