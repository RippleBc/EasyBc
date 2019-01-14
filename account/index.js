const util = require('../utils')

const Buffer = util.Buffer;

class Account
{
  constructor(data)
  {
    data = data || {};

    // Define Properties
    let fields = [{
      name: "nonce",
      default: Buffer.alloc(0)
    }, {
      name: "balance",
      default: Buffer.alloc(0)
    }];

    util.defineProperties(this, fields, data);
  }

  /**
   * Returns the rlp encoding of the account
   * @method serialize
   * @memberof Account
   * @return {Buffer}
   */

  isEmpty()
  {
    return this.balance.toString("hex") === "" && this.nonce.toString("hex") === "";
  }
}

module.exports = Account;