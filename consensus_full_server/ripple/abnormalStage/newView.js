const NewViewData = require("../data/newView");
const ViewChange = require("../data/viewChange");
const utils = require("../../../depends/utils");
const assert = require("assert");
const { RIPPLE_STATE_NEW_VIEW,
  PROTOCOL_CMD_NEW_VIEW_REQ,
  PROTOCOL_CMD_NEW_VIEW_RES,
  STAGE_STATE_EMPTY,
  STAGE_STATE_PROCESSING,
  RIPPLE_STATE_VIEW_CHANGE_NEW_VIEW_EXPIRATION,
  STAGE_FINISH_SUCCESS,

  STAGE_AMALGAMATE,
  STAGE_PRE_PREPARE,
  STAGE_PREPARE,
  STAGE_COMMIT,
  STAGE_FETCH_CANDIDATE,
  STAGE_PROCESS_CONSENSUS_CANDIDATE,

  RIPPLE_STATE_CONSENSUS,
  RIPPLE_STATE_VIEW_CHANGE_FOR_CONSENSUS_FAIL,
  RIPPLE_STATE_FETCH_PROCESS_STATE } = require("../constants");
const LeaderStage = require("../stage/leaderStage");
const Candidate = require("../data/candidate");

const rlp = utils.rlp;
const BN = utils.BN;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class NewView extends LeaderStage {
  constructor(ripple) {

    super({ name: 'newView', expiration: RIPPLE_STATE_VIEW_CHANGE_NEW_VIEW_EXPIRATION })

    this.ripple = ripple;
  }

  run() {
    if (this.state !== STAGE_STATE_EMPTY) {
      logger.error(`NewView run, state should be ${STAGE_STATE_EMPTY}, now is ${this.state}`);

      return;
    }
    
    logger.info(`NewView run begin, sequence: ${this.ripple.sequence.toString('hex')}, hash: ${this.ripple.hash.toString('hex')}, number: ${this.ripple.number.toString('hex')}, view: ${this.ripple.view.toString('hex')}`);

    //
    this.state = STAGE_STATE_PROCESSING;

    //
    this.ripple.state = RIPPLE_STATE_NEW_VIEW;

    // node is leader
    if (this.ripple.checkLeader(process[Symbol.for("address")])) {

      //
      this.clearOtherStateForNewViewBegin();

      // encode view changes
      const viewChanges = [];
      const consensusViewChangeHash = this.ripple.viewChangeForTimeout.consensusViewChange.hash(false).toString("hex");
      for (let viewChange of this.ripple.viewChangeForTimeout.trimedViewChangesByAddress.values())
      {
        if (consensusViewChangeHash === viewChange.hash(false).toString('hex'))
        {
          viewChanges.push(viewChange.serialize());
        }
      }

      // 
      const newView = new NewViewData({
        blockHash: this.ripple.viewChangeForTimeout.consensusViewChange.blockHash,
        number: this.ripple.viewChangeForTimeout.consensusViewChange.number,
        viewChanges: rlp.encode(viewChanges)
      });

      // broadcast amalgamated transactions
      p2p.sendAll(PROTOCOL_CMD_NEW_VIEW_REQ, newView.serialize());

      // begin timer
      this.startTimer();

      //
      let resCandidate = new Candidate({
        blockHash: this.ripple.hash,
        number: this.ripple.number,
        view: this.ripple.view
      });
      resCandidate.sign(privateKey);

      //
      this.validateAndProcessExchangeData(resCandidate, process[Symbol.for("address")]);
    }
    else
    {
      logger.fatal(`NewView run, view is ${this.ripple.view.toString('hex')}, is not a leader`);

      proccess.exit(1);
    }
  }

  /**
   * @param {Number} code 
   */
  handler(code) {
    if(code !== STAGE_FINISH_SUCCESS)
    {
      logger.info(`NewView handler, failed because of ${code}`);
    }

    // node is not leader
    if (!this.ripple.checkLeader(process[Symbol.for("address")])) {
      this.clearOtherStateForNewViewBegin();
    }

    // reset
    this.ripple.viewChangeForTimeout.reset();
    this.ripple.newView.reset();

    //
    this.ripple.runNewConsensusRound();
  }

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
  handleMessage(address, cmd, data) {
    assert(Buffer.isBuffer(address), `NewView handleMessage, address should be an Buffer, now is ${typeof address}`);
    assert(typeof cmd === "number", `NewView handleMessage, cmd should be a Number, now is ${typeof cmd}`);
    assert(Buffer.isBuffer(data), `NewView handleMessage, data should be an Buffer, now is ${typeof data}`);

    switch (cmd) {
      case PROTOCOL_CMD_NEW_VIEW_REQ:
        {
          const newView = new NewViewData(data);

          //
          if(!newView.validate())
          {
            logger.error(`NewView handleMessage, address: ${address.toString('hex')}, validate failed`)
          }

          // check hash
          if (newView.blockHash.toString('hex') !== this.ripple.hash.toString('hex'))
          {
            logger.error(`NewView handleMessage, address: ${address.toString('hex')}, blockHash should be ${this.ripple.hash.toString('hex')}, now is ${newView.blockHash.toString('hex')}`)

            return;
          }

          // check number
          if (newView.number.toString('hex') !== this.ripple.number.toString('hex')) {
            logger.error(`NewView handleMessage, address: ${address.toString('hex')}, number should be ${this.ripple.number.toString('hex')}, now is ${newView.number.toString('hex')}`)

            return;
          }

          const viewChanges = rlp.decode(newView.viewChanges).map(viewChange => new ViewChange(viewChange));

          // check size
          if (viewChanges.length < this.ripple.threshould)
          {
            logger.info(`NewView handleMessage, invalid newView msg, not reach threshould, address: ${address.toString('hex')}`);

            return;
          }

          // check view change
          const trimedViewChangesByAddress = new Set();
          let viewChangeHash;
          for(let viewChange of viewChanges)
          {
            //
            if (!viewChange.validate()) {
              logger.info(`NewView handleMessage, invalid viewChange of newView, address: ${address.toString('hex')}`);

              return;
            }

            // check if same
            if (!viewChangeHash)
            {
              viewChangeHash = viewChange.hash(false).toString('hex');
            }
            else
            {
              if (viewChangeHash !== viewChange.hash(false).toString('hex'))
              {
                logger.info(`NewView handleMessage, address: ${address.toString('hex')}, viewChange's hash should be ${viewChangeHash}, now is ${viewChange.hash(false).toString('hex')}`);

                return;
              }
            }

            // check repeat
            const fromAddress = viewChange.from.toString('hex');
            if (trimedViewChangesByAddress.has(fromAddress))
            {
              logger.info(`NewView handleMessage, address: ${address.toString('hex')}, repeated address: ${fromAddress}`);

              return;
            }

            //
            trimedViewChangesByAddress.add(fromAddress.toString('hex'))
          }

          // check if new view is valid
          const newViewBN = new BN(viewChanges[0].view).addn(1)
          if (newViewBN.lte(new BN(this.ripple.view)))
          {
            logger.info(`NewView handleMessage, address: ${address.toString('hex')}, view should largger or equal to ${this.ripple.view.toString('hex')}, now is ${viewChanges[0].view.toString('hex')}`);

            return;
          }

          // check if sequence is valid
          if (this.ripple.sequence.toString('hex') !== viewChanges[0].sequence.toString('hex'))
          {
            logger.error(`NewView handleMessage, address: ${address.toString('hex')}, sequence should be ${this.ripple.sequence.toString('hex')}, now is ${newView.sequence.toString('hex')}`)

            return;
          }

          //
          this.state = STAGE_STATE_PROCESSING;

          //
          this.ripple.state = RIPPLE_STATE_NEW_VIEW;
          
          // update view
          this.ripple.view = newViewBN.toBuffer();

          // update water line
          this.ripple.lowWaterLine = this.ripple.newLowWaterLine;

          // update sequence
          this.ripple.sequence = this.ripple.lowWaterLine.toBuffer();

          //
          let resCandidate = new Candidate({
            blockHash: this.ripple.hash,
            number: this.ripple.number,
            view: this.ripple.view
          });

          //
          resCandidate.sign(privateKey);

          p2p.send(address, PROTOCOL_CMD_NEW_VIEW_RES, resCandidate.serialize());

          this.handler(STAGE_FINISH_SUCCESS)
        }
        break;
      case PROTOCOL_CMD_NEW_VIEW_RES:
        {
          if (this.state !== STAGE_STATE_PROCESSING) {
            logger.info(`NewView handleMessage, state should be ${STAGE_STATE_PROCESSING}, now is ${this.state}`);

            return;
          }

          if (this.ripple.checkLeader(process[Symbol.for("address")])) {
            this.validateAndProcessExchangeData(new Candidate(data), address.toString('hex'));
          }
        }
        break;
    }
  }

  clearOtherStateForNewViewBegin()
  {
    // check state
    if (this.ripple.state === RIPPLE_STATE_CONSENSUS) {
      this.ripple.clearStateConsensus();
    }
    else if (this.ripple.state === RIPPLE_STATE_VIEW_CHANGE_FOR_CONSENSUS_FAIL) {
      this.ripple.viewChangeForConsensusFail.reset();
    }
    else if (this.ripple.state === RIPPLE_STATE_FETCH_PROCESS_STATE) {
      this.ripple.fetchConsensusState.reset();
    }
  }
}

module.exports = NewView;