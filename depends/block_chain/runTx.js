const async = require("async");
const utils = require("../utils");
const Transaction = require('../transaction');
const assert = require("assert");
const Buffer = utils.Buffer;
const BN = utils.BN;

/**
 * Process a transaction.
 * @param {Object} opts
 * @prop {Transaction} opts.tx - a transaction
 * @prop {Boolean} opts.skipNonce - skips the nonce check
 * @prop {Boolean} opts.skipBalance - skips the balance check
 */
module.exports = async function(opts)
{
  assert(opts.tx instanceof Transaction, `runTx, opts.tx should be an Transaction, now is ${typeof opts.tx}`);

  const tx = opts.tx;
  const skipNonce = opts.skipNonce || false;
  const skipBalance = opts.skipBalance || false;


  let fromAccount = this.stateManager.cache.get(tx.from);
  // check balance
  if(!opts.skipBalance && new BN(fromAccount.balance).lt(tx.getUpfrontCost()))
  {
    await Promise.reject(`runTx ${tx.hash(true).toString("hex")}, address ${tx.from.toString("hex")}'s fund should bigger than ${tx.getUpfrontCost().toString(10)}, now is ${utils.bufferToInt(fromAccount.balance)}`);
  }
  // compute the nonce
  fromAccount.nonce = new BN(fromAccount.nonce).addn(1);
  // check nonce
  if(!opts.skipNonce && !(new BN(fromAccount.nonce).eq(new BN(tx.nonce))))
  {
    await Promise.reject(`runTx ${tx.hash(true).toString("hex")}, transaction ${tx.hash(true).toString("hex")}'s nonce should be ${utils.bufferToInt(fromAccount.nonce)}, now is ${utils.bufferToInt(tx.nonce)}`);
  }
  let newBalance;
  // sub coin
  if(new BN(fromAccount.balance).lt(new BN(tx.value)))
  {
    newBalance = 0;
  }
  else
  {
    newBalance = new BN(fromAccount.balance).sub(new BN(tx.value));
  }
  fromAccount.balance = utils.toBuffer(newBalance);
  
  //
  let toAccount = this.stateManager.cache.get(tx.to);

  // add coin
  newBalance = new BN(toAccount.balance).add(new BN(tx.value));
  toAccount.balance = utils.toBuffer(newBalance);

  // run contract
  const errMsg = this.runContract({
    account: toAccount, 
    txData: opts.tx.data})
  if(errMsg)
  {
    await Promise.reject(`run contract error ${errMsg}`);
  }

  await this.stateManager.putAccount(tx.from, fromAccount.serialize());
  await this.stateManager.putAccount(tx.to, toAccount.serialize());
}
