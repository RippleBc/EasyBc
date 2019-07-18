const app = process[Symbol.for('app')];
const rp = require("request-promise");
const utils = require("../../depends/utils");
const { SUCCESS, OTH_ERR, PARAM_ERR } = require("../../constant")

const Buffer = utils.Buffer;
const rlp = utils.rlp;

const Buffer = utils.Buffer;
const rlp = utils.rlp;

const sign = (data, privateKey) => {

}

app.use((req, res, next) => {
    if(req.url.includes("unl"))
    {
        
    }
    else if (req.url.includes("addNodes")
        || req.url.includes("updateNodes")
        || req.url.includes("deleteNodes")
        || req.url.includes("perishNode")
        || req.url.includes("pardonNodes")) {

        if (!req.body.data) {
            return res.send({
                code: PARAM_ERR,
                msg: "param error, need data"
            });
        }

        //
        const options = {
            method: "POST",
            uri: `http://${host}:${port}${req.url}`,
            body: {
                data: sign(req.body.data, req.body.privateKey)
            },
            json: true
        };

        rp(options).then(response => {
            res.send({
                code: response.code,
                data: response.data,
                msg: response.msg
            })
        }).catch(e => {
            res.send({
                code: OTH_ERR,
                msg: e.toString()
            })
        });
    }
    else
    {
        next()
    }
})