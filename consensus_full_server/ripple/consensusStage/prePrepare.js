const Candidate = require("../data/candidate");
const CandidateDigest = require("../data/candidateDigest");
const utils = require("../../../depends/utils");
const assert = require("assert");
const { STAGE_PRE_PREPARE,
  PROTOCOL_CMD_PRE_PREPARE_REQ,
  PROTOCOL_CMD_PRE_PREPARE_RES,
  STAGE_STATE_EMPTY,
  STAGE_STATE_PROCESSING,
  STAGE_PRE_PREPARE_EXPIRATION,
  STAGE_FINISH_SUCCESS } = require("../constants");
const LeaderStage = require("../stage/leaderStage");

const rlp = utils.rlp;
const sha256 = utils.sha256;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class PrePrepare extends LeaderStage {
  constructor(ripple) {

    super({ name: 'prePrepare', expiraion: STAGE_PRE_PREPARE_EXPIRATION })

    this.ripple = ripple;
  }

  run() {
    if (this.state !== STAGE_STATE_EMPTY) {
      logger.fatal(`PrePrepare run, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

      process.exit(1);
    }

    //
    this.state = STAGE_STATE_PROCESSING;

    //
    this.ripple.stage = STAGE_PRE_PREPARE;


    // node is leader
    if (this.ripple.checkLeader(process[Symbol.for("address")])) {
      const now = Date.now();

      //
      this.ripple.candidate = new Candidate({
          hash: this.ripple.hash,
          number: this.ripple.number,
          timestamp: now,
          view: this.ripple.view,
          transactions: rlp.encode([...this.ripple.amalgamatedTransactions].map(tx => Buffer.from(tx, 'hex')))
      })
      this.ripple.candidate.sign(privateKey);

      //
      this.ripple.amalgamatedCandidateDigest = new CandidateDigest({
        hash: this.ripple.hash,
        number: this.ripple.number,
        timestamp: now,
        view: this.ripple.view,
        digest: sha256(this.ripple.candidate.transactions)
      })
      this.ripple.amalgamatedCandidateDigest.sign(privateKey);

      // broadcast amalgamated transactions
      p2p.sendAll(PROTOCOL_CMD_PRE_PREPARE_REQ, this.ripple.candidate.serialize())

      // begin timer
      this.startTimer()

      //
      const candidate = new Candidate({
        hash: this.ripple.hash,
        number: this.ripple.number,
        timestamp: Date.now(),
        view: this.ripple.view
      });
      candidate.sign(privateKey);

      //
      this.validateAndProcessExchangeData(candidate, process[Symbol.for("address")]);
    }
    else {
      this.ripple.startLeaderTimer();
    }
  }

  handler()
  {
    // node is not leader
    if (!this.ripple.checkLeader(process[Symbol.for("address")])) {
      this.ripple.clearLeaderTimer();
    }
    
    this.ripple.prepare.run();
  }

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
  handleMessage(address, cmd, data) {
    assert(Buffer.isBuffer(address), `PrePrepare handleMessage, address should be an Buffer, now is ${typeof address}`);
    assert(typeof cmd === "number", `PrePrepare handleMessage, cmd should be a Number, now is ${typeof cmd}`);
    assert(Buffer.isBuffer(data), `PrePrepare handleMessage, data should be an Buffer, now is ${typeof data}`);

    if (this.state !== STAGE_STATE_PROCESSING) {
      logger.info(`PrePrepare handleMessage, state should be ${STAGE_STATE_PROCESSING}, now is ${this.state}`);

      return;
    }

    switch (cmd) {
      case PROTOCOL_CMD_PRE_PREPARE_REQ:
        {
          // sender is leader
          if (this.ripple.checkLeader(address.toString('hex'))) {

            // init candidate
            this.ripple.candidate = new Candidate(date);
            this.ripple.candidate.sign(privateKey);

            // init candidate transactions
            const decodedTransactions = rlp.decode(this.ripple.candidate.transactions);
            this.ripple.amalgamatedTransactions = decodedTransactions.map(tx => tx.toString('hex'));

            // init candidateDigest
            this.ripple.candiateDigest = new CandidateDigest({
              hash: this.ripple.candidate.hash,
              number: this.ripple.candidate.number,
              timestamp: this.ripple.candidate.timestamp,
              view: this.ripple.candidate.view,
              digest: sha256(this.ripple.candidate.transactions)
            });
            this.ripple.candiateDigest.sign(privateKey);

            //
            this.state = STAGE_STATE_FINISH;

            // 
            const candidate = new Candidate({
              hash: this.ripple.hash,
              number: this.ripple.number,
              timestamp: Date.now(),
              view: this.ripple.view
            });
            candidate.sign(privateKey);

            //
            p2p.send(address, PROTOCOL_CMD_PRE_PREPARE_RES, candidate.serialize());

            this.handler(STAGE_FINISH_SUCCESS);
          }
        }
        break;
      case PROTOCOL_CMD_PRE_PREPARE_RES:
        {
          if (this.ripple.checkLeader(process[Symbol.for("address")])) {
            this.validateAndProcessExchangeData(new Candidate(data), address.toString('hex'));
          } 
        }
        break;
    }
  }
}

module.exports = PrePrepare;