const { ACCOUNT_TYPE_CONSTRACT, TX_TYPE_TRANSACTION } = require("../../consensus_constracts/constant");
const { SUCCESS } = require("../../constant");
const assert = require("assert");
const utils = require("../../depends/utils");
const Transaction = require("../../depends/transaction");
const log4js = require("../logConfig");
const selfChainCode = require("../../globalConfig.json").blockChain.code;
const rp = require("request-promise");
const constractManager = require("../../consensus_constracts/index.js");
const sideChainConstractId = require("../../consensus_constracts/sideChainConstract").id;
const Account = require("../../depends/account");
const { saveSendedSpv, getSideChain } = require("./db");

const logger = log4js.getLogger();

const rlp = utils.rlp;
const Buffer = utils.Buffer;

const blockDb = process[Symbol.for("blockDb")];
const accountTrie = process[Symbol.for("accountTrie")];

/**
 * @param {Buffer} blockNumber
 * @param {Array} transactions
 */
module.exports = async (blockNumber, transactions) => {
  assert(Buffer.isBuffer(blockNumber), `broadCastSpv, blockNumber should be an Buffer, now is ${typeof blockNumber}`)
  assert(Array.isArray(transactions), `broadCastSpv, transactions should be an Array, now is ${typeof transactions}`)

  // get block
  const block = await blockDb.getBlockByNumber(blockNumber);

  // init account tire
  const trie = accountTrie.copy();
  trie.root = block.header.stateRoot;

  for (let tx of transactions) {
    // check if an normal tx
    if (constractManager.checkTxType({ tx }) !== TX_TYPE_TRANSACTION) {
      continue;
    }

    // check if to address is an constract
    const toAccount = await new Promise((resolve, reject) => {
      trie.get(tx.to, (err, result) => {
        if (!!err) {
          reject(err);
        }

        resolve(new Account(result));
      })
    });
    if (constractManager.checkAccountType({
      account: toAccount
    }) !== ACCOUNT_TYPE_CONSTRACT) {
      continue;
    }

    // get constract info
    let constractId;
    let chainCode;
    try {
      const decodedConstractDataArray = rlp.decode(toAccount.data);
      constractId = decodedConstractDataArray[0].toString("hex");
      chainCode = decodedConstractDataArray[2].toString("hex");
    }
    catch (e) {
      continue;
    }

    // check if is a sideChainConstract
    if (constractId !== sideChainConstractId) {
      continue;
    }

    // save spv request
    const [, created] = await saveSendedSpv(blockNumber, tx, chainCode)
    if (!created) {
      continue;
    }

    // send spv request
    const sideChains = await getSideChain(chainCode);
    for (let sideChain of sideChains) {
      send(sideChain.url, blockNumber, tx).catch(e => {
        logger.error(`send throw exception, ${e}`);
      });
    }
  }
}

const send = async (url, blockNumber, tx) => {
  assert(typeof url === "string", `send, url should be a String, now is ${typeof url}`);
  assert(Buffer.isBuffer(blockNumber), `send, blockNumber should be an Buffer, now is ${typeof blockNumber}`)
  assert(tx instanceof Transaction, `send, tx should be an instance of Transaction, now is ${typeof tx}`)

  const response = await rp({
    method: "POST",
    uri: `${url}/newSpv`,
    body: {
      hash: tx.hash().toString('hex'),
      number: blockNumber.toString('hex'),
      to: tx.from.toString('hex'),
      value: tx.value.toString("hex"),
      chainCode: selfChainCode
    },
    json: true // Automatically stringifies the body to JSON
  });

  if (response.code !== SUCCESS) {
    await Promise.reject(response.msg);
  }
}