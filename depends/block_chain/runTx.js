const async = require("async");
const util = require("../utils");
const Block = require("../block");

const Buffer = utils.Buffer;
const BN = util.BN;

/**
 * Process a transaction.
 * @method processTx
 * @param {Object} opts
 * @prop {Block} opts.block needed to process the transaction
 * @prop {Transaction} opts.tx - a transaction
 * @prop {Boolean} opts.skipNonce - skips the nonce check
 * @prop {Boolean} opts.skipBalance - skips the balance check
 * @prop cb {Function} - the callback
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

    logger.info("subTxValue address: " + tx.from.toString("hex") + ", nonce: " + util.bufferToInt(fromAccount.nonce) + ", balance: " + util.bufferToInt(fromAccount.balance))

    // check balance
    if(!opts.skipBalance && new BN(fromAccount.balance).lt(tx.getUpfrontCost()))
    {
      message = "sender " + tx.from.toString("hex") + " doesn't have enough funds to send tx. The upfront cost is: " + tx.getUpfrontCost().toString() + " and the sender's account only has: " + new BN(fromAccount.balance).toString();
      return cb(message);
    }

    // increment the nonce
    fromAccount.nonce = new BN(fromAccount.nonce).addn(1);

    // check nonce
    if(!opts.skipNonce && !(new BN(fromAccount.nonce).eq(new BN(tx.nonce))))
    {
      message = "the tx doesn't have the correct nonce. account " + tx.from.toString("hex") + " has nonce of: " + new BN(fromAccount.nonce).toString() + " and tx has nonce of: " + new BN(tx.nonce).toString();
      return cb(message);
    }

    // sub coin
    let newBalance = new BN(fromAccount.balance).sub(new BN(tx.value));
    fromAccount.balance = util.toBuffer(newBalance);

    self.stateManager.putAccount(tx.from, fromAccount, cb);
  }
  
  function addTxValue(cb)
  {
    let toAccount = self.stateManager.cache.get(tx.to);

    logger.info("addTxValue address: " + tx.to.toString("hex") + ", nonce: " + util.bufferToInt(toAccount.nonce) + ", balance: " + util.bufferToInt(toAccount.balance))

    // add coin
    var newBalance = new BN(toAccount.balance).add(new BN(tx.value));
    toAccount.balance = util.toBuffer(newBalance);

    self.stateManager.putAccount(tx.to, toAccount, cb);
  }
}
