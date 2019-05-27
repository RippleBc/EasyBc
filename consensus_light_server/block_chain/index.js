const { SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_PACKED, TRANSACTION_STATE_NOT_EXISTS } = require("../../constant");
const process = require('process');
const app = process[Symbol.for('app')];
const Transaction = require("../../depends/transaction");

const mysql = process[Symbol.for("mysql")];

app.post("/sendTransaction", function(req, res) {
    if(!req.body.tx) {
        res.json({
            code: PARAM_ERR,
            msg: "param error, need tx"
        });
        return;
    }

    let transaction;

    (async () => {
        try
        {
            transaction = new Transaction(Buffer.from(req.body.tx, "hex"));

            let {state, msg} = transaction.validate();
            if(!state)
            {
                return Promise.reject(`sendTransaction, transaction invalid failed, ${msg}`);
            }
        }
        catch(e)
        {
            return Promise.reject(`sendTransaction, new Transaction() failed, ${e}`)
        }

        await mysql.saveRawTransaction(transaction.hash().toString('hex'), req.body.tx);
    })().then(() => {
        res.json({
            code: SUCCESS,
            msg: ''
        });
    }).catch(e => {
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

    const address = req.body.address

    (async () => {
        const blockChainHeight = await mysql.getBlockChainHeight();
        if(blockChainHeight === undefined)
        {
            return;
        }

        const block = await mysql.getBlockByNumber(blockChainHeight);
        const blockHeight = block.header.number.toString("hex");
        const stateRoot = block.header.stateRoot.toString("hex");
        
        return await mysql.getAccount(blockHeight, stateRoot, address);
    }).then(account => {
        if(account)
        {
            res.json({
                code: SUCCESS,
                msg: "",
                data: account.serialize().toString("hex")
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
    });
});

app.post("/getTransactions", function(req, res) {
    mysql.getTransactions({ 
        hash: req.body.hash, 
        from: req.body.from, 
        to: req.body.to, 
        beginTime: req.body.beginTime, 
        endTime: req.body.endTime
    }).then(transactions => {
        return res.json({
            code: SUCCESS,
            msg: "",
            data: transactions.map(tx => {
                return {
                    id: tx.id,
                    hash: tx.hash.toString('hex'),
                    nonce: tx.nonce.toString('hex'),
                    from: tx.from.toString('hex'),
                    to: tx.to.toString('hex'),
                    value: tx.value.toString('hex'),
                    createdAt: tx.createdAt
                }
            })
        });
    });
});

app.post("/getBlockByNumber", function(req, res) {
    if(!req.body.number) {
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
                data: block.serialize().toString("hex")
            });
        }
       
        return res.json({
            code: OTH_ERR,
            msg: `getBlockByNumber, block not exist, number ${req.body.number}`
        });
    });
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
                data: block.serialize().toString("hex")
            });
        }
        else
        {
            return res.json({
                code: SUCCESS,
                msg: ""
            });
        }
    }).catch(e => {
        return res.json({
            code: OTH_ERR,
            msg: e.toString()
        });
    });
});