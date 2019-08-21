const assert = require("assert");
const Account = require("../depends/account");
const utils = require("../depends/utils");
const StageManager = require("../depends/block_chain/stateManager");
const Transaction = require("../depends/transaction");
const { COMMAND_CREATE, STATE_DESTROYED, STATE_LIVE } = require("./constant");

const rlp = utils.rlp;
const BN = utils.BN;

class Constract 
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
   * @param {Mysql} mysql
   */
  async run(timestamp, stateManager, tx, fromAccount, toAccount, mysql) {
    assert(Buffer.isBuffer(timestamp), `Constract run, timestamp should be an Buffer, now is ${typeof timestamp}`);
    assert(stateManager instanceof StageManager, `Constract run, stateManager should be an instance of StageManager, now is ${typeof stateManager}`);
    assert(tx instanceof Transaction, `Constract run, tx should be an instance of Transaction, now is ${typeof tx}`);
    assert(fromAccount instanceof Account, `Constract run, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `Constract run, toAccount should be an instance of Account, now is ${typeof toAccount}`);

    const commands = rlp.decode(tx.data)

    if (new BN(commands[0]).eqn(COMMAND_CREATE))
    {
      this.id = Buffer.from(this.contractId, "hex");
      this.state = STATE_LIVE;
      
      await this.create(...commands.slice(2), timestamp, stateManager, tx, fromAccount, toAccount, mysql);
    }
    else
    {
      // check state
      if (new BN(this.state).eqn(STATE_DESTROYED)) {
        throw new Error(`Constract, contract has destroyed`)
      }

      await this.commandHandler(timestamp, stateManager, tx, fromAccount, toAccount, mysql);
    }
  }

  async create() {
    throw new Error(`Constract please inplement create`)
  }

  encodeArray(array) {
    return rlp.encode(array);
  }

  encodeMap(map)
  {
    return rlp.encode([...map]);
  }

  encodeSet(set)
  {
    return rlp.encode([...set]);
  }
}

module.exports = Constract;