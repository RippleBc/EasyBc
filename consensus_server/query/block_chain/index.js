const dataWrapper = require("./dataWrapper");
const { SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_PACKED, TRANSACTION_STATE_NOT_EXISTS } = require("../../../constant");
const process = require('process');

const app = process[Symbol.for('app')];

app.post("/sendTransaction", function(req, res) {
    if(!req.body.tx) {
        res.json({
            code: PARAM_ERR,
            msg: "param error, need tx"
        });
        return;
    }

    const result = process.send({
        cmd: 'processTransaction',
        data: req.body.tx
    });

    if(result === true)
    {
        res.json({
            code: SUCCESS,
            msg: ''
        });
    }
    else
    {
        res.json({
            code: OTH_ERR,
            msg: 'system is busy, please try again after a few seconds'
        });
    }
});


app.post("/getAccountInfo", function(req, res) {
	if(!req.body.address) {
        return res.json({
            code: PARAM_ERR,
            msg: "param error, need address"
        });
    }
    dataWrapper.getAccount(req.body.address).then(account => {
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
    });
});


app.post("/getTransactionState", function(req, res) {
    if(!req.body.hash) {
        return res.json({
            code: PARAM_ERR,
            msg: "param error, need data"
        });
    }

    dataWrapper.getTrasaction(req.body.hash).then(transaction => {
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

app.post("/getBlockByNumber", function(req, res) {
    if(!req.body.number) {
        return res.json({
            code: PARAM_ERR,
            msg: "getBlockByNumber, param error, need number"
        });
    }

    dataWrapper.getBlockByNumber(req.body.number).then(block => {
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
    dataWrapper.getLastestBlock().then(block => {
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
        
    });
});