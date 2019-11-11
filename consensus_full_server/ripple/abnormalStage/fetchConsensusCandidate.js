const { STAGE_STATE_EMPTY,
  STAGE_STATE_PROCESSING, 
  STAGE_STATE_FINISH,
  PROTOCOL_CMD_CONSENSUS_CANDIDATE_REQ, 
  PROTOCOL_CMD_CONSENSUS_CANDIDATE_RES,
  STAGE_FETCH_CANDIDATE,
  RIPPLE_STATE_FETCH_CONSENSUS_CANDIDATE_EXPIRATION } = require("../../constant");
const CandidateDigest = require("../data/candidateDigest");
const Candidate = require("../data/candidate");
const utils = require("../../../depends/utils");

const sha256 = utils.sha256;

const privateKey = process[Symbol.for("privateKey")];
const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];

class FetchConsensusCandidate
{
  handleMessage(ripple)
  {
    this.ripple = ripple;

    this.state = STAGE_STATE_EMPTY;

    this.cheatedNodes = [];
  }

  /**
   * @param {Function} handler 
   */
  run(handler)
  {
    if (this.state !== STAGE_STATE_EMPTY) {
      logger.fatal(`FetchConsensusCandidate run, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

      process.exit(1);
    }

    this.state = STAGE_STATE_PROCESSING;

    this.ripple.stage = STAGE_FETCH_CANDIDATE;

    this.handler = handler;

    //
    p2p.sendAll(PROTOCOL_CMD_CONSENSUS_CANDIDATE_REQ, this.ripple.consensusCandidateDigest.serialize());

    this.timer = setTimeout(() => {
      logger.fatal(`FetchConsensusCandidate run, fetch consensus candidate failed, ${process[Symbol.for("getStackInfo")]()}`);

      this.timer = undefined;

      // consensus success
      // hash, number, view check success
      // try to fetch consensus candidate failed
      // try to sync state
      this.ripple.fetchProcessState.syncNodeState();
    }, RIPPLE_STATE_FETCH_CONSENSUS_CANDIDATE_EXPIRATION);
  }

  /**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
  handleMessage(address, cmd, data) {
    assert(Buffer.isBuffer(address), `FetchConsensusCandidate handleMessage, address should be an Buffer, now is ${typeof address}`);
    assert(typeof cmd === "number", `FetchConsensusCandidate handleMessage, cmd should be a Number, now is ${typeof cmd}`);
    assert(Buffer.isBuffer(data), `FetchConsensusCandidate handleMessage, data should be an Buffer, now is ${typeof data}`);

    switch (cmd) {
      case PROTOCOL_CMD_CONSENSUS_CANDIDATE_REQ:
      {
          const consensusCandidateDigest = new CandidateDigest(data);

          if (!consensusCandidateDigest.validate())
          {
            logger.error(`FetchConsensusCandidate handleMessage validate, address: ${address.toString('hex')}, validate failed`);

            this.cheatedNodes.push({
              address: address.toString('hex'),
              reason: CHEAT_REASON_INVALID_SIG
            });

            return;
          }

          // 
          if (this.ripple.candidateDigest && this.ripple.candidateDigest.hash(false).toString('hex') !== consensusCandidateDigest.hash(false).toString('hex'))
          {
            logger.error(`FetchConsensusCandidate handleMessage, candidateDigest should be ${this.ripple.candidateDigest.hash(false).toString('hex')}, now is ${consensusCandidateDigest.hash(false).toString('hex')}`);

            return;
          }

          p2p.send(address, PROTOCOL_CMD_CONSENSUS_CANDIDATE_RES, this.ripple.candidate.serialize())
      }
      break;

      case PROTOCOL_CMD_CONSENSUS_CANDIDATE_RES:
      {
          if (this.state !== STAGE_STATE_PROCESSING) {
            logger.info(`FetchConsensusCandidate handleMessage, state should be ${STAGE_STATE_PROCESSING}, now is ${this.state}`);

            return;
          }

          const candidate = new Candidate(data);

          if (!candidate.validate()) {
            logger.error(`FetchConsensusCandidate handleMessage validate, address: ${address.toString('hex')}, validate failed`);

            this.cheatedNodes.push({
              address: address.toString('hex'),
              reason: CHEAT_REASON_INVALID_SIG
            });

            return;
          }

          // 
          if (this.ripple.consensusCandidateDigest.digest.toString('hex') !== sha256(candidate.transactions).toString('hex')) {
            logger.error(`FetchConsensusCandidate handleMessage, txs digest should be ${this.ripple.consensusCandidateDigest.digest.toString('hex')}, now is ${sha256(candidate.transactions).toString('hex')}`);
            
            return;
          }

          // init candidate
          this.ripple.candidate = new Candidate({
            hash: this.ripple.consensusCandidateDigest.hash,
            number: this.ripple.consensusCandidateDigest.number,
            timestamp: this.ripple.consensusCandidateDigest.timestamp,
            view: this.ripple.consensusCandidateDigest.view,
            transactions: candidate.transactions
          });
          this.ripple.candidate.sign(privateKey);

          //
          this.state = STAGE_STATE_FINISH;

          clearTimeout(this.timer);
          this.timer = undefined;

          this.handler();
      }
      break;
    }
  }

  reset()
  {
    this.state = STAGE_STATE_EMPTY;

    this.cheatedNodes = [];

    if (this.timer)
    {
      clearTimeout(this.timer);
    }
  }
}

module.exports = FetchConsensusCandidate;