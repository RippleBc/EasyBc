const assert = require("assert");
const { BN } = require("../../depends/utils");

const accountMapKey = Symbol('accountMap');
const stateManagerKey = Symbol('stateManager');

class SendTransaction
{
  constructor(stateManager, ...args)
  {

    this[stateManagerKey] = stateManager;
    this[accountMapKey] = new Map();

    for (let [address, account] of args)
    {
      this[accountMapKey].set(address.toString('hex'), account);
    }
  }

  /**
   * @param {Buffer} fromAddress 
   * @param {Buffer} toAddress
   * @param {Buffer} value
   */
  async send(fromAddress, toAddress, value)
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

    if (!fromAccount)
    {
      return;
    }

    if (new BN(fromAccount.balance).lt(new BN(value)))
    {
      return;
    }

    let toAccount = this[accountMapKey].get(toAddress.toString('hex'));
    if (!toAccount)
    {
      toAccount = await this[stateManagerKey].getAccount(toAddress);
    }

    fromAccount.balance = new BN(fromAccount.balance).sub(new BN(value)).toBuffer();
    toAccount.balance = new BN(toAccount.balance).add(new BN(value)).toBuffer();
  }
}

module.exports = SendTransaction;