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
    }, {
      name: "data",
      default: Buffer.alloc(0)
    }];

    utils.defineProperties(this, fields, data);
  }

  isEmpty()
  {
    return this.nonce.toString("hex") === "" && this.balance.toString("hex") === "";
  }
}

module.exports = Account;