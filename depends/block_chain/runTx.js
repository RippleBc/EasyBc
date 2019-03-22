const async = require("async");
const util = require("../utils");
const Block = require("../block");

const Buffer = utils.Buffer;
const BN = util.BN;
const toBuffer = 
/**
 * Process a transaction.
 * @param {Object} opts
 * @prop {Transaction} opts.tx - a transaction
 * @prop {Boolean} opts.skipNonce - skips the nonce check
 * @prop {Boolean} opts.skipBalance - skips the balance check
 */
module.exports = async function(opts)
{
  const block = opts.block;
  const tx = opts.tx;
  const skipNonce = opts.skipNonce | false;
  const skipBalance = opts.skipBalance | false;


  let fromAccount = this.stateManager.cache.get(tx.from);
  // check balance
  if(!opts.skipBalance && new BN(fromAccount.balance).lt(tx.getUpfrontCost()))
  {
    await Promise.reject(`runTx, address ${tx.from.toString("hex")}'s fund should bigger than ${tx.getUpfrontCost().toString(16)}, now is ${fromAccount.balance.toString("hex")}`);
  }
  // compute the nonce
  fromAccount.nonce = new BN(fromAccount.nonce).addn(1);
  // check nonce
  if(!opts.skipNonce && !(new BN(fromAccount.nonce).eq(new BN(tx.nonce))))
  {
    await Promise.reject(`runTx, transaction ${tx.hash(true)}'s nonce should be ${fromAccount.nonce.toString("hex")}, now is ${tx.nonce}`);
  }
  // sub coin
  const newBalance = new BN(fromAccount.balance).sub(new BN(tx.value));
  fromAccount.balance = util.toBuffer(newBalance);
  
 
  let toAccount = self.stateManager.cache.get(tx.to);
  // add coin
  var newBalance = new BN(toAccount.balance).add(new BN(tx.value));
  toAccount.balance = util.toBuffer(newBalance);

  await stateManager.putAccount(tx.from, fromAccount);
  await stateManager.putAccount(tx.to, toAccount);
}
