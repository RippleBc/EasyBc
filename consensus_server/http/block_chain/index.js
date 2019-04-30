const dataWrapper = require("./dataWrapper");
const { SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_PACKED, TRANSACTION_STATE_NOT_EXISTS } = require("../../constant");

const processor = process[Symbol.for('processor')];
const app = process[Symbol.for('app')];

app.post("/sendTransaction", function(req, res) {
    if(!req.body.tx) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need tx"
        });
        return;
    }

    processor.processTransaction(req.body.tx)
    .then(() => {
        res.send({
            code: SUCCESS,
            msg: ""
        });
    });
});


app.post("/getAccountInfo", function(req, res) {
	if(!req.body.address) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need address"
        });
    }
    dataWrapper.getAccount(req.body.address).then(account => {
        if(account)
        {
            res.send({
                code: SUCCESS,
                msg: "",
                data: account.serialize().toString("hex")
            });
        }
        else
        {
            res.send({
                code: SUCCESS,
                msg: ""
            });
        }
    });
});


app.post("/getTransactionState", function(req, res) {
    if(!req.body.hash) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need data"
        });
    }

    dataWrapper.getTrasaction(req.body.hash).then(transaction => {
        if(!transaction)
        {
            return res.send({
                code: SUCCESS,
                msg: "",
                data: TRANSACTION_STATE_NOT_EXISTS
            });
        }

        res.send({
            code: SUCCESS,
            msg: "",
            data: TRANSACTION_STATE_PACKED
        });
    });
});

app.post("/getBlockByNumber", function(req, res) {
    if(!req.body.number) {
        return res.send({
            code: PARAM_ERR,
            msg: "getBlockByNumber, param error, need number"
        });
    }

    dataWrapper.getBlockByNumber(req.body.number).then(block => {
        if(block)
        {
            return res.send({
                code: SUCCESS,
                msg: "",
                data: block.serialize().toString("hex")
            });
        }
       
        return res.send({
            code: OTH_ERR,
            msg: `getBlockByNumber, block not exist, number ${req.body.number}`
        });
    });
});

app.post("/getLastestBlock", function(req, res) {
    dataWrapper.getLastestBlock().then(block => {
        if(block)
        {
            return res.send({
                code: SUCCESS,
                msg: "",
                data: block.serialize().toString("hex")
            });
        }
        else
        {
            return res.send({
                code: SUCCESS,
                msg: ""
            });
        }
        
    });
});