const { STAGE_STATE_EMPTY,
  STAGE_STATE_PROCESSING, 
  STAGE_STATE_FINISH,
  PROTOCOL_CMD_CONSENSUS_CANDIDATE_REQ, 
  PROTOCOL_CMD_CONSENSUS_CANDIDATE_RES,
  STAGE_FETCH_CANDIDATE,
  RIPPLE_STATE_FETCH_CONSENSUS_CANDIDATE_EXPIRATION,
  CHEAT_REASON_INVALID_SIG,
  CHEAT_REASON_INVALID_ADDRESS } = require("../constants");
const CandidateDigest = require("../data/candidateDigest");
const Candidate = require("../data/candidate");
const utils = require("../../../depends/utils");
const assert = require("assert");

const sha256 = utils.sha256;

const privateKey = process[Symbol.for("privateKey")];
const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];

class FetchConsensusCandidate
{
  constructor(ripple)
  {
    this.ripple = ripple;

    this.state = STAGE_STATE_EMPTY;
  }

  /**
   * @param {Function} handler 
   */
  run(handler)
  {
    if (this.state !== STAGE_STATE_EMPTY) {
      logger.fatal(`FetchConsensusCandidate run, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

      process[Symbol.for("gentlyExitProcess")]();
    }

    logger.info(`FetchConsensusCandidate run begin, sequence: ${this.ripple.sequence.toString('hex')}, hash: ${this.ripple.hash.toString('hex')}, number: ${this.ripple.number.toString('hex')}, view: ${this.ripple.view.toString('hex')}`);


    this.state = STAGE_STATE_PROCESSING;

    this.ripple.stage = STAGE_FETCH_CANDIDATE;

    this.handler = handler;

    //
    p2p.sendAll(PROTOCOL_CMD_CONSENSUS_CANDIDATE_REQ, this.ripple.decidedCandidateDigest.serialize());

    this.timer = setTimeout(() => {
      logger.warn(`FetchConsensusCandidate run, fetch consensus candidate failed, ${process[Symbol.for("getStackInfo")]()}`);

      this.timer = undefined;

      // consensus success
      // hash, number, view check success
      // try to fetch consensus candidate failed
      // try to sync state
      this.ripple.syncProcessState().catch(e => {
        logger.fatal(`FetchConsensusCandidate run, throw exception, ${e}`);

        process[Symbol.for("gentlyExitProcess")]();
      });
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

          // check sig
          if (!consensusCandidateDigest.validate()) {
            logger.error(`FetchConsensusCandidate handleMessage, address: ${address.toString('hex')}, validate failed`);

            this.ripple.cheatedNodes.push({
              address: address.toString('hex'),
              reason: CHEAT_REASON_INVALID_SIG
            });

            return;
          }

          // check if msg address is correspond with connect address
          if (address.toString('hex') !== consensusCandidateDigest.from.toString("hex")) {
            logger.error(`FetchConsensusCandidate handleMessage, address should be ${address.toString('hex')}, now is ${consensusCandidateDigest.from.toString("hex")}`);

            this.ripple.cheatedNodes.push({
              address: address,
              reason: CHEAT_REASON_INVALID_ADDRESS
            });

            return;
          }

          // check if has enter next round
          if (!this.ripple.candidateDigest)
          {
            logger.info(`FetchConsensusCandidate handleMessage, sequence ${consensusCandidateDigest.sequence.toString('hex')}, round has finished`);

            return;
          }

          // check if in the same round
          if (this.ripple.candidateDigest.hash(false).toString('hex') !== consensusCandidateDigest.hash(false).toString('hex'))
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

          // check sig
          if (!candidate.validate()) {
            logger.error(`FetchConsensusCandidate handleMessage validate, address: ${address.toString('hex')}, validate failed`);

            this.ripple.cheatedNodes.push({
              address: address.toString('hex'),
              reason: CHEAT_REASON_INVALID_SIG
            });

            return;
          }

          // check if msg address is correspond with connect address
          if (address.toString('hex') !== candidate.from.toString("hex")) {
            logger.error(`${this.name} Stage validateReqData, address should be ${address.toString('hex')}, now is ${candidate.from.toString("hex")}`);

            this.ripple.cheatedNodes.push({
              address: address,
              reason: CHEAT_REASON_INVALID_ADDRESS
            });

            return;
          }

          // check transactions digest
          if (this.ripple.decidedCandidateDigest.digest.toString('hex') !== sha256(candidate.transactions).toString('hex')) {
            logger.error(`FetchConsensusCandidate handleMessage, txs digest should be ${this.ripple.decidedCandidateDigest.digest.toString('hex')}, now is ${sha256(candidate.transactions).toString('hex')}`);
            
            return;
          }

          // init candidate
          this.ripple.candidate = new Candidate({
            sequence: this.ripple.decidedCandidateDigest.sequence,
            blockHash: this.ripple.decidedCandidateDigest.blockHash,
            number: this.ripple.decidedCandidateDigest.number,
            timestamp: this.ripple.decidedCandidateDigest.timestamp,
            view: this.ripple.decidedCandidateDigest.view,
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

    if (this.timer)
    {
      clearTimeout(this.timer);
    }
  }
}

module.exports = FetchConsensusCandidate;