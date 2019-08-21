const { ACCOUNT_TYPE_CONSTRACT, TX_TYPE_TRANSACTION } = require("../../consensus_constracts/constant");
const assert = require("assert");
const utils = require("../../depends/utils");
const Transaction = require("../../depends/transaction");
const log4js = require("../logConfig");
const blockChainCode = require("../../globalConfig.json").blockChain.code;
const rp = require("request-promise");
const constractManager = require("../../consensus_constracts/index.js");
const sideChainConstractId = require("../../consensus_constracts/sideChainConstract").id;
const Account = require("../../depends/account");

const logger = log4js.getLogger();

const rlp = utils.rlp;
const Buffer = utils.Buffer;

const mysql = process[Symbol.for("mysql")];
const blockDb = process[Symbol.for("blockDb")];
const accountTrie = process[Symbol.for("accountTrie")];

/**
 * @param {Buffer} blockNumber
 * @param {Array} transactions
 */
module.exports = async (blockNumber, transactions) =>
{
  assert(Buffer.isBuffer(blockNumber), `broadCastSpv, blockNumber should be an Buffer, now is ${typeof blockNumber}`)
  assert(Array.isArray(transactions), `broadCastSpv, transactions should be an Array, now is ${typeof transactions}`)

  const block = await blockDb.getBlockByNumber(blockNumber);
  const stateRoot = block.header.stateRoot.toString("hex");

  // init account tire
  const trie = accountTrie.copy();
  trie.root = Buffer.from(stateRoot, "hex");

  // init get account function
  const getAccount = async address => {
    assert(Buffer.isBuffer(address), `broadCastSpv, address should be an Buffer, now is ${typeof address}`)

    return await new Promise((resolve, reject) => {
      trie.get(address, (err, result) => {
        if (!!err) {
          reject(err);
        }

        resolve(new Account(result));
      })
    });
  }

  // broadCast spv
  for (let tx of transactions) {
    // check if an normal tx
    if (constractManager.checkTxType({tx}) !== TX_TYPE_TRANSACTION) {
      continue;
    }

    // check if to address is an constract
    const toAccount = await getAccount(tx.to);
    if (constractManager.checkAccountType({
      account: toAccount
    }) !== ACCOUNT_TYPE_CONSTRACT) {
      continue;
    }

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
    await mysql.saveSendedSpv(blockNumber, tx, chainCode)

    // send spv request
    const sideChains = await mysql.getSideChain(chainCode);
    for (let sideChain of sideChains)
    {
      broadCastSpv(sideChain.url, blockNumber, tx).catch(e => {
        logger.error(`broadCastSpv throw exception, ${e}`);
      });
    }
  }
}

const broadCastSpv = (url, blockNumber, tx) => {
  assert(typeof url === "string", `broadCastSpv, url should be a String, now is ${typeof url}`);
  assert(Buffer.isBuffer(blockNumber), `broadCastSpv, blockNumber should be an Buffer, now is ${typeof blockNumber}`)
  assert(tx instanceof Transaction, `broadCastSpv, tx should be an instance of Transaction, now is ${typeof tx}`)

  const options = {
    method: "POST",
    uri: `${url}/newSpv`,
    body: {
      hash: tx.hash().toString('hex'),
      number: blockNumber.toString('hex'),
      chainCode: blockChainCode
    },
    json: true // Automatically stringifies the body to JSON
  };

  const promise = new Promise((resolve, reject) => {
    rp(options).then(response => {
      if (response.code !== SUCCESS) {
        reject(response.msg);
      }
      resolve(response.data);
    }).catch(e => {
      reject(e.toString());
    });
  });

  return promise;
}