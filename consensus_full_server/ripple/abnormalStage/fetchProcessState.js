const Candidate = require("../data/candidate");
const utils = require("../../../depends/utils");
const ConsensusStage = require("../stage/consensusStage");
const assert = require("assert");
const { RIPPLE_STATE_FETCH_PROCESS_STATE,
  PROTOCOL_CMD_PROCESS_STATE_REQ,
  PROTOCOL_CMD_PROCESS_STATE_RES,
  STAGE_STATE_EMPTY,
  STAGE_STATE_PROCESSING,
  RIPPLE_STATE_FETCH_PROCESS_STATE_EXPIRATION,
  STAGE_FINISH_SUCCESS } = require("../constants");

const Buffer = utils.Buffer;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const unlManager = process[Symbol.for("unlManager")];
const privateKey = process[Symbol.for("privateKey")];

class FetchProcessState extends ConsensusStage {
  constructor(ripple) {
    super({ name: 'fetchProcessState', expiration: RIPPLE_STATE_FETCH_PROCESS_STATE_EXPIRATION, threshould: parseInt(unlManager.unlFullSize / 3 + 1 )})

    this.ripple = ripple;
  }

  run() {
    if (this.state !== STAGE_STATE_EMPTY) {
      logger.fatal(`FetchProcessState run, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);

      process[Symbol.for("gentlyExitProcess")]();
    }

    //
    logger.info(`FetchProcessState run begin, sequence: ${this.ripple.sequence.toString('hex')}, hash: ${this.ripple.hash.toString('hex')}, number: ${this.ripple.number.toString('hex')}, view: ${this.ripple.view.toString('hex')}`);
    
    //
    this.state = STAGE_STATE_PROCESSING;

    // 
    this.ripple.state = RIPPLE_STATE_FETCH_PROCESS_STATE;

    //
    const reqCandidate = new Candidate({
      sequence: this.ripple.sequence,
      blockHash: this.ripple.hash,
      number: this.ripple.number,
      view: this.ripple.view
    });
    reqCandidate.sign(privateKey);

    // broadcast
    p2p.sendAll(PROTOCOL_CMD_PROCESS_STATE_REQ, reqCandidate.serialize());

    // begin timer
    this.startTimer();

    //
    this.validateAndProcessExchangeData(reqCandidate, process[Symbol.for("address")]);
  }

  /**
   * @param {Number} code 
   * @param {Candidate} candidate
   */
  handler(code, candidate) {
    assert(typeof code === 'number', `FetchProcessState handler, code should be a Number, now is ${typeof code}`);

    //
    if (code === STAGE_FINISH_SUCCESS)
    {
      assert(candidate instanceof Candidate, `FetchProcessState handler, candidate should be an instanceof Candidate, now is ${typeof candidate}`);
      
      // update view
      this.ripple.view = candidate.view;

      // sequence
      this.ripple.sequence = candidate.sequence;

      // check hash and number
      if (this.ripple.hash.toString('hex') === candidate.blockHash.toString('hex')
        && this.ripple.number.toString('hex') === candidate.number.toString('hex'))
      {
        //
        this.reset();

        //
        this.ripple.runNewConsensusRound();
      }
      else
      {
        //
        this.reset();

        //
        this.ripple.syncProcessState();
      }
    }
    else
    {
      logger.info(`FetchProcessState handler, failed because of ${code}`);

      //
      this.reset();

      //
      this.run();
    }
  }

  /**
 * @param {Buffer} address
 * @param {Number} cmd
 * @param {Buffer} data
 */
  handleMessage(address, cmd, data) {
    assert(Buffer.isBuffer(address), `FetchProcessState handleMessage, address should be an Buffer, now is ${typeof address}`);
    assert(typeof cmd === "number", `FetchProcessState handleMessage, cmd should be a Number, now is ${typeof cmd}`);
    assert(Buffer.isBuffer(data), `FetchProcessState handleMessage, data should be an Buffer, now is ${typeof data}`);

    switch (cmd) {
      case PROTOCOL_CMD_PROCESS_STATE_REQ:
        {
          // check req candidate
          const reqCandidate = new Candidate(data);
          if (!this.validateReqData(reqCandidate, address.toString('hex'))) {
            return;
          }

          //
          let resCandidate = new Candidate({
            sequence: this.ripple.sequence,
            blockHash: this.ripple.hash,
            number: this.ripple.number,
            view: this.ripple.view,
          });
          resCandidate.sign(privateKey);

          //
          p2p.send(address, PROTOCOL_CMD_PROCESS_STATE_RES, resCandidate.serialize());

        }
        break;
      case PROTOCOL_CMD_PROCESS_STATE_RES:
        {
          if (this.state !== STAGE_STATE_PROCESSING) {
            logger.info(`FetchProcessState handleMessage, state should be ${STAGE_STATE_PROCESSING}, now is ${this.state}`);

            return;
          }

          this.validateAndProcessExchangeData(new Candidate(data), address.toString('hex'));
        }
        break;
    }
  }

  reset()
  {
    super.reset();

    //
    this.consensusProcessState = undefined;
  }
}

module.exports = FetchProcessState;