const Cache = require("./cache");
const { SUCCESS, PARAM_ERR, OTH_ERR, TRANSACTION_STATE_PACKED, TRANSACTION_STATE_NOT_EXISTS } = require("../../constant");

const cache = new Cache();
app.post("/getAccountInfo", function(req, res) {
	if(!req.body.address) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need address"
        });
    }
    cache.getAccount(req.body.address).then(account => {
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

    cache.getTrasaction(req.body.hash).then(transaction => {
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

    cache.getBlockByNumber(req.body.number).then(block => {
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
    cache.getLastestBlock().then(block => {
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