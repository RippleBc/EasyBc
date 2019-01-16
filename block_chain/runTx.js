const Buffer = require("safe-buffer").Buffer
const async = require("async")
const util = require("../utils")
const Block = require("../block")

const BN = util.BN;

/**
 * Process a transaction. Transfers coin. Checks balances.
 * @method processTx
 * @param opts
 * @param opts.block {Block} needed to process the transaction
 * @param opts.tx {Transaction} - a transaction
 * @param opts.skipNonce - skips the nonce check
 * @param opts.skipBalance - skips the balance check
 * @param cb {Function} - the callback
 */
module.exports = function(opts, cb)
{
  const self = this;
  const block = opts.block;
  const tx = opts.tx;

  async.series([
    subTxValue,
    addTxValue,
  ], cb);

  function subTxValue(cb)
  {
    let fromAccount = self.stateManager.cache.get(tx.from);
    let message;

    if(!opts.skipBalance && new BN(fromAccount.balance).lt(tx.getUpfrontCost()))
    {
      message = "sender doesn't have enough funds to send tx. The upfront cost is: " + tx.getUpfrontCost().toString() + " and the sender's account only has: " + new BN(fromAccount.balance).toString();
      return cb(new Error(message));
    } 
    else if(!opts.skipNonce && !(new BN(fromAccount.nonce).eq(new BN(tx.nonce))))
    {
      message = "the tx doesn't have the correct nonce. account has nonce of: " + new BN(fromAccount.nonce).toString() + " and tx has nonce of: " + new BN(tx.nonce).toString();
      return cb(new Error(message));
    }

    // increment the nonce
    fromAccount.nonce = new BN(fromAccount.nonce).addn(1);

    // sub coin
    let newBalance = new BN(fromAccount.balance).sub(txValue);
    fromAccount.balance = newBalance;

    stateManager.putAccountBalance(util.toBuffer(caller), newBalance, cb)
  }
  
  function addTxValue(cb)
  {
    toAccount = stateManager.cache.get(toAddress);

    // add coin
    var newBalance = new BN(toAccount.balance).add(txValue);
    toAccount.balance = newBalance;
    
    stateManager.putAccount(util.toBuffer(toAddress), toAccount, cb);
  }
}
