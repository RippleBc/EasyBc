const CrowdFund = require("./crowdFun");
const async = require("async");
const utils = require("../utils");
const assert = require("assert");
const Account = require("../account");
const StageManager = require("../depends/block_chain/stateManager");

const Buffer = utils.Buffer;
const BN = utils.BN;
const rlp = utils.rlp;

class ContractsManager
{
  constructor()
  {
    this.contractsMap = new Map();

    this.contractsMap.set(crowdFund.id, CrowdFund);
  }

  /**
   * 
   * @param {Object}
   *  - stateManager {StageManager}
   *  - fromAccount {Account}
   *  - toAccount {Account}
   *  - txData {Buffer}
   *  - txValue {Buffer}
   */
  run({ stateManager, fromAccount, toAccount, txData, txValue }) {
    assert(stateManager instanceof StageManager, `runContract, stateManager should be an instance of StageManager, now is ${typeof stateManager}`);
    assert(fromAccount instanceof Account, `runContract, fromAccount should be an instance of Account, now is ${typeof fromAccount}`);
    assert(toAccount instanceof Account, `runContract, toAccount should be an instance of Account, now is ${typeof toAccount}`);
    assert(Buffer.isBuffer(txData), `runContract, txData should be an Buffer, now is ${typeof txData}`)
    assert(Buffer.isBuffer(txValue), `runContract, txValue should be an Buffer, now is ${typeof txValue}`)

    if (toAccount.data.length <= 0 || txData.length <= 0) {
      return true;
    }

    // get contractId
    const constractData = rlp.decode(toAccount.data);
    const contractId = constractData[0].toString("hex");

    // get contract
    const Contract = this.contractsMap.get(contractId)

    // run contract
    return new Contract(toAccount.data).run(stateManager, fromAccount, toAccount, rlp.decode(txData), txValue)
  }
}

module.exports = new ContractsManager();