const CrowdFund = require("./crowdFund");
const utils = require("../depends/utils");
const assert = require("assert");
const StageManager = require("../depends/block_chain/stateManager");
const Account = require("../depends/account");
const Transaction = require("../depends/transaction");
const { COMMAND_CREATE } = require("./constant");

const rlp = utils.rlp;
const bufferToInt = utils.bufferToInt;

class ContractsManager
{
  constructor()
  {
    this.contractsMap = new Map();

    this.contractsMap.set(CrowdFund.id, CrowdFund);
  }

  /**
   * @param {StageManager} stateManager
   * @param {Transaction} tx
   * @param {Account} fromAccount
   * @param {Account} toAccount
   */
  run({ stateManager, tx, fromAccount, toAccount }) {
    assert(stateManager instanceof StageManager, `ContractsManager run, stateManager should be an instance of StageManager, now is ${typeof stateManager}`);
    assert(tx instanceof Transaction, `ContractsManager run, tx should be an instance of Transaction, now is ${typeof tx}`);
    assert(fromAccount instanceof Account, `ContractsManager run, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `ContractsManager run, toAccount should be an instance of Account, now is ${typeof toAccount}`);

    // transaction is not to operate an contract(command is empty)
    if (tx.data.length <= 0) 
    {
      return;
    }

    let commands;
    try 
    {
      commands = rlp.decode(tx.data)
    } 
    catch (err) 
    {
      // transaction is not to operate an contract(invalid commands)
      return;
    }
    

    // get command id
    const commandId = bufferToInt(commands[0]);

    // transaction is not to operate an contract(constract is empty and command is no not to create an contract)
    if (toAccount.data.length == 0 && commandId !== COMMAND_CREATE)
    {
      return
    }

    // fetch contract id
    let contractId;
    if (commandId === COMMAND_CREATE)
    {
      // contract is not exist
      contractId = commands[1];

      commands.splice(1, 1);
    }
    else
    {
      // contract is exist
      contractId = rlp.decode(toAccount.data)[0].toString("hex"); 
    }
    
    // get contract
    const Contract = this.contractsMap.get(contractId)

    const contractInstacne = new Contract(toAccount.data.length > 0 ? toAccount.data : undefined);

    // run contract
    contractInstacne.run(stateManager, tx, fromAccount, toAccount);

    // update contract
    toAccount.data = contractInstacne.serialize();
  }
}

module.exports = new ContractsManager();