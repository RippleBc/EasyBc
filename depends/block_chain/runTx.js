const utils = require("../utils");
const Transaction = require('../transaction');
const assert = require("assert");
const Buffer = utils.Buffer;
const BN = utils.BN;
const constractsManager = require("../../consensus_constracts");
const { ACCOUNT_TYPE_NORMAL, ACCOUNT_TYPE_CONSTRACT, TX_TYPE_TRANSACTION, TX_TYPE_CREATE_CONSTRACT, TX_TYPE_UPDATE_CONSTRACT } = require("../../consensus_constracts/constant");

/**
 * Process a transaction.
 * @param {Object} opts
 * @prop {Transaction} opts.tx - a transaction
 * @prop {Boolean} opts.skipNonce - skips the nonce check
 * @prop {Boolean} opts.skipBalance - skips the balance check
 */
module.exports = async function(opts)
{
  assert(Buffer.isBuffer(opts.timestamp), `runTx, opts.timestamp should be an Buffer, now is ${typeof opts.timestamp}`);
  assert(opts.tx instanceof Transaction, `runTx, opts.tx should be an Transaction, now is ${typeof opts.tx}`);

  const timestamp = opts.timestamp;
  const tx = opts.tx;
  const skipNonce = opts.skipNonce || false;
  const skipBalance = opts.skipBalance || false;


  let fromAccount = this.stateManager.cache.get(tx.from);

  // check fromAccount type
  const accountType = constractsManager.checkAccountType({
    account: fromAccount
  });
  if(accountType === ACCOUNT_TYPE_CONSTRACT)
  {
    await Promise.reject(`runTx ${tx.hash(true).toString("hex")}, address: ${tx.from.toString("hex")}} is an constract account, not support directly transform`)
  }

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
  
  // get toAccount
  const toAccount = this.stateManager.cache.get(tx.to);;

  // check tx type
  const txType = constractsManager.checkTxType({
    tx: tx
  });

  // run constract
  if (txType === TX_TYPE_CREATE_CONSTRACT || txType === TX_TYPE_UPDATE_CONSTRACT)
  {
    if (txType === TX_TYPE_CREATE_CONSTRACT && !toAccount.isEmpty()) 
    {
      await Promise.reject(`runTx, to address ${tx.to.toString("hex")} has existed, can not create`);
    }

    if (txType === TX_TYPE_UPDATE_CONSTRACT && toAccount.isEmpty())
    {
      await Promise.reject(`runTx, to address ${tx.to.toString("hex")} not exist, can not update`);
    }

    // add coin
    newBalance = new BN(toAccount.balance).add(new BN(tx.value));
    toAccount.balance = utils.toBuffer(newBalance);

    // run constract
    try {
      await constractsManager.run({
        timestamp: timestamp,
        stateManager: this.stateManager, 
        receiptManager: this.receiptManager,
        mysql: process[Symbol.for("mysql")],
        tx: tx,
        fromAccount: fromAccount,
        toAccount: toAccount
      });
    }
    catch (e) {
      await Promise.reject(`runTx, run constract throw exception, ${process[Symbol.for("getStackInfo")](e)}`);
    }
  }
  else
  {
    // add coin
    newBalance = new BN(toAccount.balance).add(new BN(tx.value));
    toAccount.balance = utils.toBuffer(newBalance);
  }
  //
  await this.stateManager.putAccount(tx.from, fromAccount.serialize());
  await this.stateManager.putAccount(tx.to, toAccount.serialize());
}
