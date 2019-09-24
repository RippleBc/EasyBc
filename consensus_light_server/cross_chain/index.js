const { QUERY_MAX_LIMIT, SUCCESS, PARAM_ERR, OTH_ERR } = require("../../constant");
const rp = require("request-promise");
const Transaction = require("../../depends/transaction");
const Account = require("../../depends/account");
const utils = require("../../depends/utils");
const privateKey = require("../../globalConfig.json").blockChain.privateKey;
const selfChainCode = require("../../globalConfig.json").blockChain.code;
const constractManager = require("../../consensus_constracts/index.js");
const sideChainConstractId = require("../../consensus_constracts/sideChainConstract").id;
const { ACCOUNT_TYPE_CONSTRACT, TX_TYPE_TRANSACTION } = require("../../consensus_constracts/constant");
const { getCrossPayRequest, getCrossPay, getSideChain, saveSideChain, saveReceivedSpv, getSideChainConstract, saveWaitingCrossPay, getWaitingCrossPay } = require("./db");
const { getTransaction, saveRawTransaction } = require("../block_chain/db");

const log4js = require("../logConfig");
const logger = log4js.getLogger();

const Buffer = utils.Buffer;
const BN = utils.BN;
const rlp = utils.rlp;
const toBuffer = utils.toBuffer;

const app = process[Symbol.for('app')];
const accountTrie = process[Symbol.for("accountTrie")];
const blockDb = process[Symbol.for("blockDb")];
const printErrorStack = process[Symbol.for("printErrorStack")]

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

  if (undefined === req.body.to) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need to"
    });
  }

  if (undefined === req.body.value) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need value"
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

    if(!block)
    {
      return res.json({
        code: OTH_ERR,
        msg: "getSpvState, spv invalid becase of block not exist"
      });
    }

    // init account trie
    const trie = accountTrie.copy();
    trie.root = block.header.stateRoot;

    // get tx
    const tx = await getTransaction(req.body.hash);
    if (!tx) {
      return res.json({
        code: OTH_ERR,
        msg: "getSpvState, spv invalid becase of tx not exist"
      });
    }

    // check to
    if(tx.from.toString('hex') !== req.body.to)
    {
      return res.json({
        code: OTH_ERR,
        msg: "getSpvState, spv invalid tx from"
      });
    }

    // check value
    if (tx.value.toString('hex') !== req.body.value) {
      return res.json({
        code: OTH_ERR,
        msg: "getSpvState, spv invalid tx value"
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
    printErrorStack(e);

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

  if (undefined === req.body.to) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need to"
    });
  }

  if (undefined === req.body.value) {
    return res.json({
      code: PARAM_ERR,
      msg: "param error, need value"
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
    const { count, rows: sideChains } = await getSideChain(req.body.chainCode);
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
            to: req.body.to,
            value: req.body.value,
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
        msg: `newSpv, invalid spv because of not reach threshold, processedTxCount ${processedTxCount}, need ${Math.ceil(SPV_SUCCESS_THRESHOLD * count)}`
      });
    }

    /****************************** save spv ******************************/
    const [, receivedSpvCreated] = await saveReceivedSpv(req.body.hash, req.body.number, req.body.chainCode);
    if (!receivedSpvCreated) {
      return res.json({
        code: OTH_ERR,
        msg: "newSpv, repeated spv"
      });
    }

    /****************************** save waiting cross pay ******************************/
    const [, waitingCrossPayCreated] = await saveWaitingCrossPay(req.body.hash, req.body.number, req.body.chainCode, req.body.to, req.body.value)
    if (!waitingCrossPayCreated) {
      return res.json({
        code: OTH_ERR,
        msg: "newSpv, repeated wating cross pay"
      });
    }

    /****************************** get waiting cross pay ******************************/
    const waitingCrossPayMap = new Map()
    const waitingCrossPays = await getWaitingCrossPay();
    if (waitingCrossPays.length <= 0)
    {
      logger.info(`newSpv, not reach cross pay process threshold`);

      return res.json({
        code: SUCCESS
      });
    }
    for (let waitingCrossPay of waitingCrossPays)
    {
      if (waitingCrossPayMap.has(waitingCrossPay.chainCode))
      {
        let value = waitingCrossPayMap.get(waitingCrossPay.chainCode)
        value.push(waitingCrossPay);

        waitingCrossPayMap.set(waitingCrossPay.chainCode, value);
      }
      else
      {
        waitingCrossPayMap.set(waitingCrossPay.chainCode, [waitingCrossPay])
      }

      await waitingCrossPay.destroy();
    }


    /****************************** getAccountInfo ******************************/
    const blockChainHeight = await blockDb.getBlockChainHeight();
    if (blockChainHeight === undefined) {
      return res.json({
        code: OTH_ERR,
        msg: "newSpv, invalid blockChainHeight"
      });
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

    for (let [chainCode, crossPayArray] of waitingCrossPayMap.entries())
    {
      // get side chain constract
      const sideChainConstractAddress = await getSideChainConstract(chainCode);

      // init tx data
      let data = [toBuffer(COMMAND_CROSS_PAY), []];
      for(let crossPay of crossPayArray)
      {
        data[1].push(Buffer.from(crossPay.hash, "hex"));
        data[1].push(Buffer.from(crossPay.number, "hex"));
        data[1].push(Buffer.from(crossPay.to, 'hex'));
        data[1].push(Buffer.from(crossPay.value, 'hex'));
      }
      data = rlp.encode(data);

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
      await saveRawTransaction(tx.hash().toString('hex'), tx.serialize().toString('hex'));
    }
    res.json({
      code: SUCCESS
    });
  })().catch(e => {
    printErrorStack(e);

    res.json({
      code: OTH_ERR,
      msg: `newSpv, throw exception, ${e}`
    });
  })
})

app.post("/getCrossPayRequest", (req, res) => {
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

  getCrossPayRequest({
    offset: req.body.offset, 
    limit: req.body.limit, 
    code: req.body.code, 
    timestamp: req.body.timestamp, 
    txHash: req.body.txHash, 
    number: req.body.number, 
    to: req.body.to, 
    value: req.body.value, 
    sponsor: req.body.sponsor, 
    beginTime: req.body.beginTime, 
    endTime: req.body.endTime
  }).then(({ count, rows }) => {
    res.json({
      code: SUCCESS,
      data: {
        count: count,
        crossPayRequests: rows
      }
    })
  }).catch(e => {
    printErrorStack(e);

    res.json({
      code: OTH_ERR,
      msg: e.toString()
    });
  });;
})

app.post("/getCrossPay", (req, res) => {
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

  getCrossPay({
    offset: req.body.offset, 
    limit: req.body.limit, 
    code: req.body.code, 
    timestamp: req.body.timestamp, 
    txHash: req.body.txHash, 
    to: req.body.to, 
    value: req.body.value, 
    beginTime: req.body.beginTime, 
    endTime: req.body.endTime
  }).then(({count, rows}) => {
    res.json({
      code: SUCCESS,
      data: {
        count: count,
        crossPays: rows
      }
    })
  }).catch(e => {
    printErrorStack(e);
    
    res.json({
      code: OTH_ERR,
      msg: e.toString()
    });
  });;
})