const assert = require("assert");
const Account = require("../../depends/account");
const { BN } = require("../../depends/utils");

const accountMapKey = Symbol('accountMap');

class SendTransaction
{
  /**
   * @param {Buffer} fromAddress 
   * @param {Account} fromAccount 
   * @param {Buffer} toAddress
   * @param {Account} toAccount
   */
  constructor(fromAddress, fromAccount, toAddress, toAccount)
  {
    assert(Buffer.isBuffer(fromAddress), `SendTransaction constructor, fromAddress should be an Buffer, now is ${typeof fromAddress}`);
    assert(fromAccount instanceof Account, `SendTransaction constructor, fromAccount should be an Account, now is ${typeof fromAccount}`);
    assert(Buffer.isBuffer(toAddress), `SendTransaction constructor, toAddress should be an Buffer, now is ${typeof toAddress}`);
    assert(toAccount instanceof Account, `SendTransaction constructor, toAccount should be an Account, now is ${typeof toAccount}`);

    this[accountMapKey] = new Map();

    this[accountMapKey].set(fromAddress.toString('hex'), fromAccount);
    this[accountMapKey].set(toAddress.toString('hex'), toAccount);
  }

  /**
   * @param {Buffer} fromAddress 
   * @param {Buffer} toAddress
   * @param {Buffer} value
   */
  send(fromAddress, toAddress, value)
  {
    assert(Buffer.isBuffer(fromAddress), `SendTransaction send, fromAddress should be an Buffer, now is ${typeof fromAddress}`);
    assert(Buffer.isBuffer(toAddress), `SendTransaction send, toAddress should be an Buffer, now is ${typeof toAddress}`);
    assert(Buffer.isBuffer(value), `SendTransaction send, value should be an Buffer, now is ${typeof value}`);

    //
    if(fromAddress.toString('hex') === toAddress.toString('hex'))
    {
      return;
    }

    const fromAccount = this[accountMapKey].get(fromAddress.toString('hex'));
    const toAccount = this[accountMapKey].get(toAddress.toString('hex'));

    if (!fromAccount)
    {
      return;
    }

    if (!toAccount)
    {
      return;
    }

    if (new BN(fromAccount.value).lt(new BN(value)))
    {
      return;
    }

    fromAccount.balance = new BN(fromAccount.balance).sub(new BN(value)).toBuffer();
    toAccount.balance = new BN(toAccount.balance).add(new BN(value)).toBuffer();
  }
}

module.exports = SendTransaction;