const crowdFund = require("./crowdFun");
const async = require("async");
const utils = require("../utils");
const assert = require("assert");
const Account = require("../account");
const contractsManager = require("../../consensus_contracts");

const Buffer = utils.Buffer;
const BN = utils.BN;
const rlp = utils.rlp;

class ContractsManager
{
  constructor()
  {
    this.contractsMap = new Map();

    this.contractsMap.set(crowdFund.id, crowdFund);
  }

  /**
   * Process an contract.
   * @param {Account} account
   * @param {Buffer} data
   */
  run({ account, txData }) {
    assert(account instanceof Account, `runContract, account should be an instance of Account, now is ${typeof account}`);
    assert(Buffer.isBuffer(data), `runContract, data should be an Buffer, now is ${typeof data}`)

    if (account.data.length <= 0 || txData.length <= 0) {
      return true;
    }

    // get contractId
    const constractData = rlp.decode(account.data);
    const contractId = constractData[0].toString("hex");

    // get contract
    const contract = this.contractsMap.get(contractId)

    // run contract
    return contract.run(account, rlp.decode(txData))
  }
}

module.exports = new ContractsManager();