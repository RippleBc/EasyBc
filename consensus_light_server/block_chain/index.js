const { QUERY_MAX_LIMIT, SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_IN_CACHE, TRANSACTION_STATE_PROCESSING, TRANSACTION_STATE_PACKED } = require("../../constant");
const { MAX_TX_TIMESTAMP_LEFT_GAP, MAX_TX_TIMESTAMP_RIGHT_GAP } = require("../constant");
const Transaction = require("../../depends/transaction");
const Account = require("../../depends/account");
const utils = require("../../depends/utils");
const accountTrie = process[Symbol.for("accountTrie")];
const blockDb = process[Symbol.for("blockDb")];
const { getTransaction, getTransactions, getRawTransaction, saveRawTransaction, truncateTokenDistribution, saveTokenDistribution, getTokenDistribution } = require("./db")
const { nibblesToBuffer } = require("../../depends/merkle_patricia_tree/util/nibbles");
const { genesis } = require("../../globalConfig.json").blockChain;

const bufferToInt = utils.bufferToInt;
const BN = utils.BN;

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


var g_refreshTokenDistribution_running = false;

app.post("/refreshTokenDistribution", (req, res) => {
    if (g_refreshTokenDistribution_running)
    {
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

    if(req.body.number)
    {
        assert(typeof req.body.number === 'string', `getTotalTokenDistribution req.body.number should be a String, now is ${typeof req.body.number}`)
    }

    (async () => {

        // get block number
        let blockNumber;
        if (req.body.number !== undefined) {
            blockNumber = Buffer.from(req.body.number, 'hex');
        }
        else
        {
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