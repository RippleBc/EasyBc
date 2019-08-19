const accountTrie = process[Symbol.for("accountTrie")];
const { mode } = require("../globalConfig.json");
const { checkTxType, checkAccountType } = require("../consensus_constracts/index.js");
const { ACCOUNT_TYPE_CONSTRACT, TX_TYPE_TRANSACTION} = require("../consensus_constracts/constant");
const assert = require("assert");
const utils = require("../depends/utils");
const sideChainConstractId = require("../consensus_constracts/sideChainConstract").id;

const rlp = utils.rlp;

/**
 * @param {Buffer} blockNumber
 * @param {Array} transactions
 */
module.exports = async (blockNumber, transactions) => {
  const block = await blockDb.getBlockByNumber(blockNumber);
  const stateRoot = block.header.stateRoot.toString("hex");

  // get account info
  const trie = accountTrie.copy();
  trie.root = Buffer.from(stateRoot, "hex");

  // init get account function
  const getAccount = async address => {
    assert(Buffer.isBuffer(address), `broadCastSpv, address should be an Buffer, now is ${typeof address}`)

    await new Promise((resolve, reject) => {
      trie.get(address, (err, result) => {
        if (!!err) {
          reject(err);
        }

        resolve(new Account(result));
      })
    });
  }

  if(mode === 'mainChain')
  {
    for (let tx of transactions)
    {
      // check if an normal tx
      if (checkTxType(tx) !== TX_TYPE_TRANSACTION)
      {
        continue;
      }

      // check if to address is an constract
      const account = await getAccount(tx.to);
      if (checkAccountType(account) !== ACCOUNT_TYPE_CONSTRACT)
      {
        continue;
      }

      let constractId;
      try {
        constractId = rlp.decode(account.data)[0].toString("hex");
      }
      catch (e) {
        continue;
      }

      // check if is a sideChainConstract
      if (constractId !== sideChainConstractId) {
        continue;
      }

      // send spv request
      
    }
  }
  else if(mode === 'sideChain')
  {
    for (let tx of transactions) {
      // check if an normal tx
      if (checkTxType(tx) !== TX_TYPE_TRANSACTION) {
        continue;
      }

      // check if an corss chain tx
      if (tx.to.toString("hex") !== '0000000000000000000000000000000000000000') {
        continue;
      }

      // send spv request
    }
  }
}
