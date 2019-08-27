const { QUERY_MAX_LIMIT, SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_IN_CACHE, TRANSACTION_STATE_PROCESSING, TRANSACTION_STATE_PACKED } = require("../../constant");
const { MAX_TX_TIMESTAMP_LEFT_GAP, MAX_TX_TIMESTAMP_RIGHT_GAP } = require("../constant");
const Transaction = require("../../depends/transaction");
const utils = require("../../depends/utils");
const accountTrie = process[Symbol.for("accountTrie")];
const blockDb = process[Symbol.for("blockDb")];
const { getTransaction, getTransactions, getRawTransaction, saveRawTransaction } = require("./db")
const bufferToInt = utils.bufferToInt;

const app = process[Symbol.for('app')];
const printErrorStack = process[Symbol.for("printErrorStack")]

app.post("/sendTransaction", function(req, res) {
    if(!req.body.tx) {
        return res.json({
            code: PARAM_ERR,
            msg: "param error, need tx"
        });
    }

    let transaction;

    (async () => {
        try
        {
            transaction = new Transaction(Buffer.from(req.body.tx, "hex"));

            let {state, msg} = transaction.validate();
            if(!state)
            {
                await Promise.reject(`sendTransaction, transaction invalid failed, ${msg}`);
            }
        }
        catch(e)
        {
            await Promise.reject(`sendTransaction, new Transaction() failed, ${e}`)
        }

        // check timestamp
        const now = Date.now();
        const txTimestamp = bufferToInt(transaction.timestamp);
        if(txTimestamp > now + MAX_TX_TIMESTAMP_RIGHT_GAP)
        {
            await Promise.reject(`sendTransaction, timestamp should litter than or equal to ${now + MAX_TX_TIMESTAMP_RIGHT_GAP}, now is ${txTimestamp}`)
        }
        if(txTimestamp < now - MAX_TX_TIMESTAMP_LEFT_GAP)
        {
            await Promise.reject(`sendTransaction, timestamp should bigger than ${now - MAX_TX_TIMESTAMP_LEFT_GAP}, now is ${txTimestamp}`)
        }

        // record
        await saveRawTransaction(transaction.hash().toString('hex'), req.body.tx);
    })().then(() => {
        res.json({
            code: SUCCESS,
            msg: ''
        });
    }).catch(e => {
        printErrorStack(e)

        res.json({
            code: OTH_ERR,
            msg: `sendTransaction, throw exception, ${e}`
        });
    });
});


app.post("/getAccountInfo", function(req, res) {
	if(!req.body.address) {
        return res.json({
            code: PARAM_ERR,
            msg: "param error, need address"
        });
    }

    const address = req.body.address;

    (async () => {
        const blockChainHeight = await blockDb.getBlockChainHeight();
        if(blockChainHeight === undefined)
        {
            return;
        }

        const block = await blockDb.getBlockByNumber(blockChainHeight);
        const stateRoot = block.header.stateRoot.toString("hex");

        // get account info
        const trie = accountTrie.copy();
        trie.root = Buffer.from(stateRoot, "hex");
        const getAccountRaw = new Promise((resolve, reject) => {
            trie.get(Buffer.from(address, "hex"), (err, result) => {
                if(!!err)
                {
                    reject(err);
                }

                resolve(result);
            })
        });
        const accountRaw = await getAccountRaw;

        if(accountRaw)
        {
            return accountRaw.toString('hex');
        }
        
    })().then(account => {
        if(account)
        {
            res.json({
                code: SUCCESS,
                msg: "",
                data: account
            });
        }
        else
        {
            res.json({
                code: SUCCESS,
                msg: ""
            });
        }
    }).catch(e => {
        printErrorStack(e)

        res.json({
            code: OTH_ERR,
            msg: e.toString()
        });
    });
});


app.post("/getTransactionState", function(req, res) {
    if(!req.body.hash) {
        return res.json({
            code: PARAM_ERR,
            msg: "param error, need data"
        });
    }

    (async () => {
        const rawTransaction = await getRawTransaction(req.body.hash)
        if(rawTransaction)
        {
            return res.json({
                code: SUCCESS,
                msg: "",
                data: TRANSACTION_STATE_IN_CACHE
            }); 
        }

        const transaction = await getTransaction(req.body.hash);
        if(transaction)
        {
            return res.json({
                code: SUCCESS,
                msg: "",
                data: TRANSACTION_STATE_PACKED
            });
        }

        return res.json({
            code: SUCCESS,
            msg: "",
            data: TRANSACTION_STATE_PROCESSING
        });
    })().catch(e => {
        printErrorStack(e)

        res.json({
            code: OTH_ERR,
            msg: e.toString()
        });
    });
});

app.post("/getTransactions", function(req, res) {
    if(undefined === req.body.offset)
    {
        return res.json({
            code: PARAM_ERR,
            msg: "param error, need offset"
        });
    }

    if(undefined === req.body.limit)
    {
        return res.json({
            code: PARAM_ERR,
            msg: "param error, need limit"
        });
    }

    if(req.body.limit >= QUERY_MAX_LIMIT)
    {
        return res.json({
            code: PARAM_ERR,
            msg: `param error, limit must little than ${QUERY_MAX_LIMIT}`
        })
    }

    getTransactions({
        offset: req.body.offset,
        limit: req.body.limit,
        hash: req.body.hash, 
        from: req.body.from, 
        to: req.body.to, 
        beginTime: req.body.beginTime, 
        endTime: req.body.endTime
    }).then(({count, rows}) => {
        res.json({
            code: SUCCESS,
            msg: "",
            data: {
                total: count, 
                transactions: rows
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

app.post("/getBlockByNumber", function(req, res) {
    if(undefined === req.body.number) {
        return res.json({
            code: PARAM_ERR,
            msg: "getBlockByNumber, param error, need number"
        });
    }

    blockDb.getBlockByNumber(Buffer.from(req.body.number, 'hex')).then(block => {
        if(block)
        {
            return res.json({
                code: SUCCESS,
                msg: "",
                data: block.serialize().toString("hex")
            });
        }
       
        res.json({
            code: OTH_ERR,
            msg: `getBlockByNumber, block not exist, number ${req.body.number}`
        });
    }).catch(e => {
        printErrorStack(e)

        res.json({
            code: OTH_ERR,
            msg: e.toString()
        });
    });;
});

app.post("/getLastestBlock", function(req, res) {
    (async () => {
        const blockChainHeight = await blockDb.getBlockChainHeight();
        if(blockChainHeight !== undefined)
        {
            return await blockDb.getBlockByNumber(blockChainHeight);
        }
    })().then(block => {
        if(block)
        {
            return res.json({
                code: SUCCESS,
                msg: "",
                data: block.serialize().toString("hex")
            });
        }
      
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
    });
});