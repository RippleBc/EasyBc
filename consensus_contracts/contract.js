const assert = require("assert");
const Account = require("../depends/account");
const utils = require("../depends/utils");
const StageManager = require("../depends/block_chain/stateManager");
const Transaction = require("../depends/transaction");
const { COMMAND_CREATE, STATE_DESTROYED, STATE_LIVE } = require("./constant");

const rlp = utils.rlp;
const BN = utils.BN;

class Contract 
{
  constructor(contractId) 
  {
    this.contractId = contractId;
  }

  /**
   * @param {Buffer} timestamp
   * @param {StageManager} stateManager
   * @param {Transaction} tx
   * @param {Account} fromAccount
   * @param {Account} toAccount
   */
  async run(timestamp, stateManager, tx, fromAccount, toAccount) {
    assert(Buffer.isBuffer(timestamp), `Contract run, timestamp should be an Buffer, now is ${typeof timestamp}`);
    assert(stateManager instanceof StageManager, `Contract run, stateManager should be an instance of StageManager, now is ${typeof stateManager}`);
    assert(tx instanceof Transaction, `Contract run, tx should be an instance of Transaction, now is ${typeof tx}`);
    assert(fromAccount instanceof Account, `Contract run, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `Contract run, toAccount should be an instance of Account, now is ${typeof toAccount}`);

    const commands = rlp.decode(tx.data)

    if (new BN(commands[0]).eqn(COMMAND_CREATE))
    {
      this.id = Buffer.from(this.contractId);
      this.state = STATE_LIVE;
      this.create(...commands.slice(2));
    }
    else
    {
      // check state
      if (new BN(this.state).eqn(STATE_DESTROYED)) {
        throw new Error(`CrowdFund, contract has destroyed`)
      }

      this.commandHandler(timestamp, stateManager, tx, fromAccount, toAccount);
    }
  }

  create() {
    throw new Error(`Contract please inplement create`)
  }
}

module.exports = Contract;