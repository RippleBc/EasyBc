const { SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_PACKED } = require("../../constant");
const rp = require("request-promise");
const Transaction = require("../../depends/transaction");
const Account = require("../../depends/account");
const utils = require("../../depends/utils");

const Buffer = utils.Buffer;

const app = process[Symbol.for('app')];
const mysql = process[Symbol.for("mysql")];
const accountTrie = process[Symbol.for("accountTrie")];
const blockDb = process[Symbol.for("blockDb")];
const printErrorStack = process[Symbol.for("printErrorStack")]

const SPV_SUCCESS_THRESHOLD = 0.8;

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

  if (undefined === req.body.constractAddress) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need constractAddress"
    });
  }

  // check spv
  const { count, rows: sideChains } = await mysql.getSideChain(req.body.chainCode);
  const processedTxCount = 0;
  for (let sideChain of sideChains)
  {
    const options = {
      method: "POST",
      uri: `${sideChain.url}/getTransactionState`,
      body: {
        hash: req.body.hash
      },
      json: true // Automatically stringifies the body to JSON
    };

    const state = await new Promise((resolve, reject) => {
      rp(options).then(response => {
        if (response.code !== SUCCESS) {
          reject(response.msg);
        }
        resolve(response.data);
      }).catch(e => {
        reject(e.toString());
      });
    });

    if (state === TRANSACTION_STATE_PACKED)
    {
      processedTxCount ++;
    }
  }
  if (processedTxCount / count < SPV_SUCCESS_THRESHOLD)
  {
    return res.json({
      code: OTH_ERR,
      msg: "newSpv, invalid spv because of there is no reach threshold"
    });;
  }

  // save
  const [, created] = await mysql.saveReceivedSpv(req.body.hash, req.body.number, req.body.chainCode);
  if (!created) {
    return res.json({
      code: OTH_ERR,
      msg: "newSpv, repeated spv"
    });;
  }

  // getAccountInfo
  const blockChainHeight = await blockDb.getBlockChainHeight();
  if (blockChainHeight === undefined) {
    return res.json({
      code: OTH_ERR,
      msg: "newSpv, invalid blockChainHeight"
    });;
  }
  const block = await blockDb.getBlockByNumber(blockChainHeight);
  const stateRoot = block.header.stateRoot.toString("hex");
  const trie = accountTrie.copy();
  trie.root = Buffer.from(stateRoot, "hex");
  const getAccountRaw = new Promise((resolve, reject) => {
    trie.get(Buffer.from(###########################, "hex"), (err, result) => {
      if (!!err) {
        reject(err);
      }

      resolve(result);
    })
  });
  const accountRaw = await getAccountRaw;
  if (!accountRaw) {
    return res.json({
      code: OTH_ERR,
      msg: "newSpv, invalid account"
    });;
  }
  
  // send tx 
  const account = new Account(accountRaw)
  const sideChainConstractAddress = await mysql.getSideChainConstract(req.body.chainCode);
  const tx = new Transaction({
    to: Buffer.from(sideChainConstractAddress, "hex"),
    value: 1,
    data
  })
})
