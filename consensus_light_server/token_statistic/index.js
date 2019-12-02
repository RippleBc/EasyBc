const { QUERY_MAX_LIMIT, SUCCESS, PARAM_ERR, OTH_ERR } = require("../../constant");
const Account = require("../../depends/account");
const utils = require("../../depends/utils");
const { truncateTokenDistribution, saveTokenDistribution, getTokenDistribution } = require("./db")
const { nibblesToBuffer } = require("../../depends/merkle_patricia_tree/util/nibbles");
const { genesis } = require("../../globalConfig.json").blockChain;

const BN = utils.BN;

const accountTrie = process[Symbol.for("accountTrie")];
const blockDb = process[Symbol.for("blockDb")];
const app = process[Symbol.for('app')];
const printErrorStack = process[Symbol.for("printErrorStack")]

var g_refreshTokenDistribution_running = false;

app.post("/refreshTokenDistribution", (req, res) => {
  if (g_refreshTokenDistribution_running) {
    return res.json({
      code: OTH_ERR,
      msg: "refreshTokenDistribution is running, please wait a moment"
    });
  }

  g_refreshTokenDistribution_running = true;

  (async () => {
    const blockChainHeight = await blockDb.getBlockChainHeight();
    if (blockChainHeight === undefined) {
      return;
    }

    const block = await blockDb.getBlockByNumber(blockChainHeight);
    const stateRoot = block.header.stateRoot.toString("hex");

    // init trie root
    const trie = accountTrie.copy();
    trie.root = Buffer.from(stateRoot, "hex");

    // truncate accounts info
    await truncateTokenDistribution();

    // traverse account info
    const traverseAccountInfo = new Promise((resolve, reject) => {
      trie._findValueNodes((nodeRef, node, fullKey, next) => {

        const account = new Account(node.value);
        const balance = utils.setLength(account.balance, 32);

        saveTokenDistribution(nibblesToBuffer(fullKey).toString("hex"), balance.toString("hex")).then(() => {
          next();
        }).catch(e => {
          reject(e);
        });

      }, () => {
        resolve()
      })
    });

    await traverseAccountInfo;

  })().then(() => {
    res.json({
      code: SUCCESS,
      msg: ""
    });
  }).catch(e => {
    printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    });
  }).finally(() => {
    g_refreshTokenDistribution_running = false;
  })
});

app.post("/getTokenDistribution", (req, res) => {
  if (undefined === req.body.offset) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need offset"
    });
  }

  if (undefined === req.body.limit) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need limit"
    });
  }

  if (req.body.limit >= QUERY_MAX_LIMIT) {
    return res.json({
      code: PARAM_ERR,
      msg: `param error, limit must little than ${QUERY_MAX_LIMIT}`
    })
  }

  getTokenDistribution({ offset: req.body.offset, limit: req.body.limit, order: req.body.order }).then(({ count, rows }) => {
    res.json({
      code: SUCCESS,
      msg: "",
      data: {
        total: count,
        accounts: rows
      }
    });
  }).catch(e => {
    printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    });
  });;
});

app.post("/getTotalTokenDistribution", (req, res) => {

  if (req.body.number) {
    assert(typeof req.body.number === 'string', `getTotalTokenDistribution req.body.number should be a String, now is ${typeof req.body.number}`)
  }

  (async () => {

    // get block number
    let blockNumber;
    if (req.body.number !== undefined) {
      blockNumber = Buffer.from(req.body.number, 'hex');
    }
    else {
      blockNumber = await blockDb.getBlockChainHeight();
      if (blockNumber === undefined) {
        return;
      }
    }

    // init trie tree
    const block = await blockDb.getBlockByNumber(blockNumber);
    const stateRoot = block.header.stateRoot.toString("hex");

    const trie = accountTrie.copy();
    trie.root = Buffer.from(stateRoot, "hex");

    // 
    let totalTokenDistribution = new BN();
    for (let i = 0; i < genesis.length; i++) {
      const accountRaw = await new Promise((resolve, reject) => {
        trie.get(Buffer.from(genesis[i].address, "hex"), (err, result) => {
          if (!!err) {
            reject(err);
          }

          resolve(result);
        })
      });

      // compute distributed token
      const account = new Account(accountRaw);
      const distributeTokenBN = new BN(Buffer.from(genesis[i].balance, "hex")).sub(new BN(account.balance))

      // compute total distribute token
      totalTokenDistribution.iadd(distributeTokenBN)
    }

    return utils.padToEven(totalTokenDistribution.toString("hex"));
  })().then(totalTokenDistribution => {
    res.json({
      code: SUCCESS,
      data: totalTokenDistribution,
      msg: ""
    });
  }).catch(e => {
    printErrorStack(e)

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    });
  })
});