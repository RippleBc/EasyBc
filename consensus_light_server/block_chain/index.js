const { QUERY_MAX_LIMIT, SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_PACKED, TRANSACTION_STATE_NOT_EXISTS } = require("../../constant");
const app = process[Symbol.for('app')];
const Transaction = require("../../depends/transaction");
const Block = require("../../depends/block");

const mysql = process[Symbol.for("mysql")];
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

        await mysql.saveRawTransaction(transaction.hash().toString('hex'), req.body.tx);
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
        const blockChainHeight = await mysql.getBlockChainHeight();
        if(blockChainHeight === undefined)
        {
            return;
        }

        const blockRawData = await mysql.getBlockByNumber(blockChainHeight);
        const block = new Block(Buffer.from(blockRawData, "hex"));
        const blockHeight = block.header.number.toString("hex");
        const stateRoot = block.header.stateRoot.toString("hex");
        
        return await mysql.getAccount(blockHeight, stateRoot, address);
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

    mysql.getTransaction(req.body.hash).then(transaction => {
        if(!transaction)
        {
            return res.json({
                code: SUCCESS,
                msg: "",
                data: TRANSACTION_STATE_NOT_EXISTS
            });
        }

        res.json({
            code: SUCCESS,
            msg: "",
            data: TRANSACTION_STATE_PACKED
        });
    }).catch(e => {
        printErrorStack(e)

        res.json({
            code: OTH_ERR,
            msg: e.toString()
        });
    });;
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

    mysql.getTransactions({
        offset: req.body.offset,
        limit: req.body.limit,
        hash: req.body.hash, 
        from: req.body.from, 
        to: req.body.to, 
        beginTime: req.body.beginTime, 
        endTime: req.body.endTime
    }).then(transactions => {
        res.json({
            code: SUCCESS,
            msg: "",
            data: transactions
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

    mysql.getBlockByNumber(Buffer.from(req.body.number, 'hex')).then(block => {
        if(block)
        {
            return res.json({
                code: SUCCESS,
                msg: "",
                data: block
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
        const blockChainHeight = await mysql.getBlockChainHeight();
        if(blockChainHeight !== undefined)
        {
            return await mysql.getBlockByNumber(blockChainHeight);
        }
    })().then(block => {
        if(block)
        {
            return res.json({
                code: SUCCESS,
                msg: "",
                data: block
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