const Candidate = require("../data/candidate");
const CandidateDigest = require("../data/candidateDigest");
const utils = require("../../../depends/utils");
const assert = require("assert");
const { RIPPLE_STAGE_PRE_PREPARE,
  PROTOCOL_CMD_PRE_PREPARE_REQ,
  PROTOCOL_CMD_PRE_PREPARE_RES,
  STAGE_STATE_EMPTY,
  STAGE_STATE_PROCESSING } = require("../../constant");
const LeaderStage = require("./leaderStage");

const rlp = utils.rlp;
const sha256 = utils.sha256;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];
const unlManager = process[Symbol.for("unlManager")];

const PRE_PREPARE_WAITING_TIME = 150;

class PrePrepare extends LeaderStage {
  constructor(ripple) {

    super({ name: 'prePrepare', expiraion: PRE_PREPARE_WAITING_TIME })

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
    this.ripple.stage = RIPPLE_STAGE_PRE_PREPARE;


    // node is leader
    if (unlManager.checkPrimaryNode(process[Symbol.for("address")])) {
      //
      this.ripple.amalgamatedCandidate = new Candidate({
          hash: this.ripple.hash,
          number: this.ripple.number,
          view: this.ripple.view,
          candidate: rlp.encode([...this.ripple.amalgamatedTransactions.map(tx => Buffer.from(tx, 'hex'))])
      })
      this.ripple.amalgamatedCandidate.sign(privateKey);

      //
      this.ripple.amalgamatedCandidateDigest = new CandidateDigest({
        hash: this.ripple.hash,
        number: this.ripple.number,
        view: this.ripple.view,
        digest: sha256(this.ripple.amalgamatedCandidate.transactions)
      })
      this.ripple.amalgamatedCandidateDigest.sign(privateKey);

      // broadcast amalgamated transactions
      p2p.sendAll(PROTOCOL_CMD_PRE_PREPARE_REQ, this.amalgamatedCandidate.serialize())

      // begin timer
      this.startTimer()
    }
  }

  handler()
  {
    // receiver is leader
    if (unlManager.checkPrimaryNode(process[Symbol.for("address")])) {

      // check view, hash and number
      for (let candidate of this.candidates) {
        
      }

      this.ripple.prePrepare.run();
    }
    else {
      this.ripple.prePrepare.run();
    }
  }

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
  async handleMessage(address, cmd, data) {
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
          if (unlManager.checkPrimaryNode(address.toString('hex'))) {

            // 
            this.ripple.amalgamatedCandidate = new Candidate(date);

            //
            const decodedTransactions = rlp.decode(this.ripple.amalgamatedCandidate.transactions);
            this.ripple.amalgamatedTransactions = decodedTransactions.map(tx => tx.toString('hex'));

            //
            this.ripple.candiateDigest = new CandidateDigest({
              hash: this.ripple.hash,
              number: this.ripple.number,
              view: this.ripple.view,
              digest: sha256(this.ripple.amalgamatedCandidate.transactions)
            });
            this.ripple.candiateDigest.sign(privateKey);

            //
            this.ripple.prepare.run();
          }

          let candidate = new Candidate({
            hash: this.ripple.hash,
            number: this.ripple.number,
            view: this.ripple.view
          });

          //
          candidate.sign(privateKey);

          p2p.send(address, PROTOCOL_CMD_TRANSACTION_AMALGAMATE_RES, candidate.serialize());
        }
        break;
      case PROTOCOL_CMD_PRE_PREPARE_RES:
        {
          if (unlManager.checkPrimaryNode(process[Symbol.for("address")])) {
            this.validateAndProcessExchangeData(new Candidate(data), address.toString('hex'));
          } 
        }
        break;
    }
  }
}

module.exports = PrePrepare;