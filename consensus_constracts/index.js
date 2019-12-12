const CrowdFundConstract = require("./crowdFundConstract");
const MultiSignConstract = require("./multiSignConstract");
const SideChainConstract = require("./sideChainConstract");
const utils = require("../depends/utils");
const assert = require("assert");
const StateManager = require("../depends/block_chain/stateManager");
const ReceiptManager = require("../depends/block_chain/receiptManager");
const Account = require("../depends/account");
const Transaction = require("../depends/transaction");
const { 
  ACCOUNT_TYPE_NORMAL, 
  ACCOUNT_TYPE_CONSTRACT, 
  COMMAND_TX, 
  COMMAND_STATIC_CREATE, 
  COMMAND_DYNAMIC_CREATE,
  COMMAND_DYNAMIC_UPDATE,
  TX_TYPE_TRANSACTION, 
  TX_TYPE_CREATE_CONSTRACT, 
  TX_TYPE_UPDATE_CONSTRACT, } = require("./constant");
const ConstractExit = require('./api/exit');

const vm = require("vm");

const rlp = utils.rlp;
const bufferToInt = utils.bufferToInt;
const Buffer = utils.Buffer;

class ContractsManager
{
  constructor()
  {
    this.contractsMap = new Map();

    this.contractsMap.set(CrowdFundConstract.id, CrowdFundConstract);
    this.contractsMap.set(MultiSignConstract.id, MultiSignConstract);
    this.contractsMap.set(SideChainConstract.id, SideChainConstract);
  }

  /**
   * @param {Buffer} timestamp
   * @param {StateManager} stateManager
   * @param {ReceiptManager} receiptManager
   * @param {Mysql} mysql
   * @param {Transaction} tx
   * @param {Account} fromAccount
   * @param {Account} toAccount
   */
  async run({ timestamp, stateManager, receiptManager, mysql, tx, fromAccount, toAccount}) {
    assert(Buffer.isBuffer(timestamp), `ContractsManager run, timestamp should be an Buffer, now is ${typeof timestamp}`);
    assert(stateManager instanceof StateManager, `ContractsManager run, stateManager should be an instance of StateManager, now is ${typeof stateManager}`);
    assert(receiptManager instanceof ReceiptManager, `ContractsManager run, receiptManager should be an instance of StateManager, now is ${typeof receiptManager}`);
    assert(tx instanceof Transaction, `ContractsManager run, tx should be an instance of Transaction, now is ${typeof tx}`);
    assert(fromAccount instanceof Account, `ContractsManager run, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `ContractsManager run, toAccount should be an instance of Account, now is ${typeof toAccount}`);

    // get command id
    const commands = rlp.decode(tx.data)
    const commandId = bufferToInt(commands[0]);

    //
    if (commandId === COMMAND_DYNAMIC_CREATE) {

      const [codeAccountAddress, code] = commands.slice(1);

      // fetch a code account
      const codeAccount = await stateManager.getAccount(codeAccountAddress);

      //
      if (!codeAccount.isEmpty())
      {
        await Promise.reject(`ContractsManager run, create a dynamic constract, codeAccount should be emtpy`);
      }

      //
      codeAccount.data = code;

      // save code account
      await stateManager.putAccount(codeAccountAddress, codeAccount.serialize());

      // save constractCodeAddress
      toAccount.data = rlp.encode([codeAccountAddress, []]);

      return;
    }

    //
    if (commandId === COMMAND_DYNAMIC_UPDATE)
    {
      // fetch code address and basic data
      let [codeAccountAddress, constractData] = rlp.decode(toAccount.data);

      // fetch code
      const codeAccount = await stateManager.getAccount(codeAccountAddress);
      if (codeAccount.isEmpty())
      {
        await Promise.reject(`ContractsManager run, codeAccount ${codeAccountAddress.toString('hex')} is empty`);
      }

      //
      let code = codeAccount.data.toString();

      // 
      const exitInstance = new ConstractExit();

      //
      const evaluateCode = `
      const { rlp } = require("../depends/utils");

      ${code}

      const constract = new Constract(...constractData);

      constract.run(...commands).then(() => {
        for(let el of constract.raw)
        {
          raw.push(el);
        }
        
        exit();
      }).catch(e => {
        exit(e);
      });
      `;

      //
      let raw = [];

      vm.runInNewContext(evaluateCode, {
          require,
          timestamp,
          stateManager, 
          receiptManager,
          mysql, 
          tx, 
          fromAccount, 
          toAccount,
          constractData,
          commands: commands.slice(1),
          exit: exitInstance.exit.bind(exitInstance),
          bufferToInt,
          toBufer: utils.toBuffer,
          raw,
          console
      }, {
        displayErrors: true,
        timeout: 2000
      });

      //
      await exitInstance.updateContractData();

      //
      toAccount.data = rlp.encode([codeAccountAddress, raw]);

      return;
    }

    // fetch contract id
    let constractId;
    if (commandId === COMMAND_STATIC_CREATE)
    {
      // contract is not exist
      constractId = commands[1].toString("hex");

      commands.splice(1, 1);
    }
    else
    {
      // contract is exist
      constractId = rlp.decode(toAccount.data)[0].toString("hex"); 
    }
    
    // get contract
    const Constract = this.contractsMap.get(constractId)
    
    const constractInstacne = new Constract(toAccount.data.length > 0 ? toAccount.data : undefined);

    // run contract
    await constractInstacne.run({timestamp, stateManager, receiptManager, mysql, tx, fromAccount, toAccount});

    // update contract
    toAccount.data = constractInstacne.serialize();
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

    return ACCOUNT_TYPE_CONSTRACT;
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
    
    if (commandId === COMMAND_STATIC_CREATE || commandId === COMMAND_DYNAMIC_CREATE)
    {
      return TX_TYPE_CREATE_CONSTRACT;
    }

    return TX_TYPE_UPDATE_CONSTRACT;
  }
}

module.exports = new ContractsManager();