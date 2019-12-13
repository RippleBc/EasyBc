const assert = require("assert");
const Account = require("../../depends/account");

const fromAccountKey = Symbol('fromAccount');
const toAccountKey = Symbol('toAccount');

const fromAddressKey = Symbol('fromAddress');
const toAddressKey = Symbol('toAddress');

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

    this[fromAddressKey] = fromAddress;
    this[fromAccountKey] = fromAccount;

    this[toAddressKey] = toAddress;
    this[toAccountKey] = toAccount;
  }

  /**
   * @param {Buffer} fromAddress 
   * @param {Buffer} toAddress
   */
  send(fromAddress, toAddress)
  {
    assert(Buffer.isBuffer(fromAddress), `SendTransaction send, fromAddress should be an Buffer, now is ${typeof fromAddress}`);
    assert(Buffer.isBuffer(toAddress), `SendTransaction send, toAddress should be an Buffer, now is ${typeof toAddress}`);
    
    //
    if(fromAddress.toString('hex') === toAddress.toString('hex'))
    {
      return;
    }

    if (this[fromAddressKey].toString('hex') !== fromAddress.toString('hex')
      && this[toAddressKey].toString('hex') !== fromAddress.toString('hex'))
      {
        return;
      }

    if (this[fromAddressKey].toString('hex') !== toAddress.toString('hex')
      && this[toAddressKey].toString('hex') !== toAddress.toString('hex')) {
      return;
    }
  }
}

module.exports = SendTransaction;