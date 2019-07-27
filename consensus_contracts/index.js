const CrowdFundContract = require("./crowdFundContract");
const utils = require("../depends/utils");
const assert = require("assert");
const StageManager = require("../depends/block_chain/stateManager");
const Account = require("../depends/account");
const Transaction = require("../depends/transaction");
const { ACCOUNT_TYPE_NORMAL, ACCOUNT_TYPE_CONTRACT, COMMAND_TX, COMMAND_CREATE, TX_TYPE_TRANSACTION, TX_TYPE_CREATE_CONTRACT, TX_TYPE_UPDATE_CONTRACT } = require("./constant");

const rlp = utils.rlp;
const bufferToInt = utils.bufferToInt;

class ContractsManager
{
  constructor()
  {
    this.contractsMap = new Map();

    this.contractsMap.set(CrowdFundContract.id, CrowdFundContract);
  }

  /**
   * @param {Buffer} timestamp
   * @param {StageManager} stateManager
   * @param {Transaction} tx
   * @param {Account} fromAccount
   * @param {Account} toAccount
   */
  run({ timestamp, stateManager, tx, fromAccount, toAccount }) {
    assert(Buffer.isBuffer(timestamp), `ContractsManager run, timestamp should be an Buffer, now is ${typeof timestamp}`);
    assert(stateManager instanceof StageManager, `ContractsManager run, stateManager should be an instance of StageManager, now is ${typeof stateManager}`);
    assert(tx instanceof Transaction, `ContractsManager run, tx should be an instance of Transaction, now is ${typeof tx}`);
    assert(fromAccount instanceof Account, `ContractsManager run, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `ContractsManager run, toAccount should be an instance of Account, now is ${typeof toAccount}`);

    // get command id
    const commands = rlp.decode(tx.data)
    const commandId = bufferToInt(commands[0]);

    // fetch contract id
    let contractId;
    if (commandId === COMMAND_CREATE)
    {
      // contract is not exist
      contractId = commands[1].toString("hex");

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
    contractInstacne.run(timestamp, stateManager, tx, fromAccount, toAccount);

    // update contract
    toAccount.data = contractInstacne.serialize();
  }

  /**
   * 
   * @param {Account} account
   */
  checkAccountType({account})
  {
    assert(account instanceof Account, `ContractsManager checkAccountType, account should be an instance of Account, now is ${typeof account}`);

    if(account.data.length <= 0)
    {
      return ACCOUNT_TYPE_NORMAL;
    }

    return ACCOUNT_TYPE_CONTRACT;
  }

  /**
   * @param {Transaction} tx
   * @return {Number}
   */
  checkTxType({ tx })
  {
    assert(tx instanceof Transaction, `ContractsManager checkTxType, tx should be an instance of Transaction, now is ${typeof tx}`);
    
    if (tx.data.length <= 0) 
    {
      return TX_TYPE_TRANSACTION;
    }

    // get command id
    const commands = rlp.decode(tx.data)
    const commandId = bufferToInt(commands[0]);

    if (commandId === COMMAND_TX)
    {
      return TX_TYPE_TRANSACTION;
    }
    
    if (commandId === COMMAND_CREATE)
    {
      return TX_TYPE_CREATE_CONTRACT;
    }

    return TX_TYPE_UPDATE_CONTRACT;
  }
}

module.exports = new ContractsManager();