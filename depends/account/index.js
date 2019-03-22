const utils = require("../utils");

const Buffer = utils.Buffer;

class Account
{
  constructor(data)
  {
    data = data || {};

    let fields = [{
      length: 32,
      name: "nonce",
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      length: 32,
      name: "balance",
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }];

    utils.defineProperties(this, fields, data);
  }

  isEmpty()
  {
    return this.balance.toString("hex") === "" && this.nonce.toString("hex") === "";
  }
}

module.exports = Account;