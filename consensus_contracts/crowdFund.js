const assert = require("assert")
const Account = require("../depends/account");

class CrowdFund
{
  constructor()
  {
    this.id = "01"
  }

  /**
   * @param {Account} account
   * @param {Array} command
   */
  run(account, command)
  {
    assert(account instanceof Account, `runContract, account should be an instance of Account, now is ${typeof account}`);
    assert(Array.isArray(command), `runContract, command should be an Array, now is ${typeof command}`);

    
  }
}