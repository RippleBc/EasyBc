const { SUCCESS, PARAM_ERR, OTH_ERR } = require("../../constant");
const rp = require("request-promise");
const Transaction = require("../../depends/transaction");
const Account = require("../../depends/account");
const utils = require("../../depends/utils");
const privateKey = require("../../globalConfig.json").blockChain.privateKey;
const selfChainCode = require("../../globalConfig.json").blockChain.code;
const constractManager = require("../../consensus_constracts/index.js");
const sideChainConstractId = require("../../consensus_constracts/sideChainConstract").id;
const { ACCOUNT_TYPE_CONSTRACT, TX_TYPE_TRANSACTION } = require("../../consensus_constracts/constant");
const assert = require("assert");

const Buffer = utils.Buffer;
const BN = utils.BN;
const rlp = utils.rlp;
const toBuffer = utils.toBuffer;

const app = process[Symbol.for('app')];
const mysql = process[Symbol.for("mysql")];
const accountTrie = process[Symbol.for("accountTrie")];
const blockDb = process[Symbol.for("blockDb")];
const logger = process[Symbol.for("errLogger")];

const publicKey = utils.privateToPublic(Buffer.from(privateKey, "hex"));
const address = utils.publicToAddress(publicKey);

const SPV_SUCCESS_THRESHOLD = 0.8;

const COMMAND_CROSS_PAY = 104;

const SPV_STATE_VALID = 1;
const SPV_STATE_MALICIOUS = 2;

app.post('/getSpvState', (req, res) => {
  if (undefined === req.body.hash) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need hash"
    });
  }

  if (undefined === req.body.number) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need number"
    });
  }

  if (undefined === req.body.chainCode) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need chainCode"
    });
  }

  (async () => {
    // get block
    const block = await blockDb.getBlockByNumber(Buffer.from(req.body.number, "hex"));

    // init account trie
    const trie = accountTrie.copy();
    trie.root = block.header.stateRoot;

    // get tx
    const tx = await mysql.getTransaction(req.body.hash);
    if (!tx) {
      return res.json({
        code: OTH_ERR,
        msg: "getSpvState, spv invalid becase of tx not exist"
      });
    }

    // check if an normal tx
    if (constractManager.checkTxType({ tx }) !== TX_TYPE_TRANSACTION) {
      return res.json({
        code: SUCCESS,
        data: SPV_STATE_MALICIOUS
      });
    }

    // get to account
    const toAccount = await new Promise((resolve, reject) => {
      trie.get(tx.to, (err, result) => {
        if (!!err) {
          reject(err);
        }

        resolve(new Account(result));
      })
    });

    // check if to address is an constract
    if (constractManager.checkAccountType({
      account: toAccount
    }) !== ACCOUNT_TYPE_CONSTRACT) {
      return res.json({
        code: SUCCESS,
        data: SPV_STATE_MALICIOUS
      });
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
      return res.json({
        code: SUCCESS,
        data: SPV_STATE_MALICIOUS
      });
    }

    // check if is an sideChainConstract
    if (constractId !== sideChainConstractId) {
      return res.json({
        code: SUCCESS,
        data: SPV_STATE_MALICIOUS
      });
    }

    // check the sideChainConstract's code is corresponded
    if (chainCode === req.body.chainCode)
    {
      return res.json({
        code: SUCCESS,
        data: SPV_STATE_VALID
      })
    }
    
    res.json({
      code: SUCCESS,
      data: SPV_STATE_MALICIOUS
    })
  })().catch(e => {
    res.json({
      code: OTH_ERR,
      msg: `getSpvState, throw exception, ${e}`
    });
  })
})

app.post('/newSpv', (req, res) => {
  if (undefined === req.body.hash) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need hash"
    });
  }

  if (undefined === req.body.number) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need number"
    });
  }

  if (undefined === req.body.chainCode) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need chainCode"
    });
  }

  (async () => {
    /****************************** check spv ******************************/
    // get side chain info
    const { count, rows: sideChains } = await mysql.getSideChain(req.body.chainCode);
    let processedTxCount = 0;
    for (let sideChain of sideChains) {
      // check if tx to self chain constract is valid
      let response;
      try {
        response = await rp({
          method: "POST",
          uri: `${sideChain.url}/getSpvState`,
          body: {
            hash: req.body.hash,
            number: req.body.number,
            chainCode: selfChainCode
          },
          json: true // Automatically stringifies the body to JSON
        });
      } catch (e) {
        logger.error(`newSpv, ${sideChain.url}/getSpvState, throw exception ${e}`);

        continue;
      }
      

      if (response.code !== SUCCESS) {
        continue
      }

      if (response.data === SPV_STATE_VALID) {
        processedTxCount++;
      }
    }
    if (processedTxCount / count < SPV_SUCCESS_THRESHOLD) {
      return res.json({
        code: OTH_ERR,
        msg: "newSpv, invalid spv because of not reach threshold"
      });;
    }

    /****************************** save spv ******************************/
    const [, created] = await mysql.saveReceivedSpv(req.body.hash, req.body.number, req.body.chainCode);
    if (!created) {
      return res.json({
        code: OTH_ERR,
        msg: "newSpv, repeated spv"
      });;
    }

    /****************************** getAccountInfo ******************************/
    const blockChainHeight = await blockDb.getBlockChainHeight();
    if (blockChainHeight === undefined) {
      return res.json({
        code: OTH_ERR,
        msg: "newSpv, invalid blockChainHeight"
      });;
    }

    // get block
    const block = await blockDb.getBlockByNumber(blockChainHeight);

    // init account trie
    const trie = accountTrie.copy();
    trie.root = block.header.stateRoot;

    // get account info
    const accountRaw = await new Promise((resolve, reject) => {
      trie.get(address, (err, result) => {
        if (!!err) {
          reject(err);
        }

        resolve(result);
      })
    });
    if (!accountRaw) {
      return res.json({
        code: OTH_ERR,
        msg: "newSpv, invalid account"
      });
    }
    const account = new Account(accountRaw)

    /****************************** send tx ******************************/
    // get side chain constract
    const sideChainConstractAddress = await mysql.getSideChainConstract(req.body.chainCode);

    // init tx data
    const data = rlp.encode([
      toBuffer(COMMAND_CROSS_PAY),
      Buffer.from(req.body.hash, "hex"),
      Buffer.from(req.body.number, "hex")])

    // init tx
    const tx = new Transaction({
      nonce: new BN(account.nonce).addn(1).toBuffer(),
      timestamp: Date.now(),
      to: Buffer.from(sideChainConstractAddress, "hex"),
      value: 1,
      data: data
    });
    tx.sign(Buffer.from(privateKey, "hex"));

    // record
    await mysql.saveRawTransaction(tx.hash().toString('hex'), tx.serialize().toString('hex'));
  
    res.json({
      code: SUCCESS
    });
  })().catch(e => {
    res.json({
      code: OTH_ERR,
      msg: `newSpv, throw exception, ${e}`
    });
  })
})
