const app = process[Symbol.for('app')];
const unlDb = process[Symbol.for("unlDb")];
const rp = require("request-promise");
const utils = require("../../depends/utils");
const { privateKey, fullConsensus: { host, port } } = require("../config");
const { SUCCESS, OTH_ERR, PARAM_ERR } = require("../../constant")

const Buffer = utils.Buffer;
const rlp = utils.rlp;

// check privilege
const publicKey = utils.privateToPublic(Buffer.from(privateKey, "hex"));

/**
 * 
 * @param {JSON Object} data 
 * @param {Number} timestamp 
 * @param {Object} sig 
 */
const verifySignature = (data, timestamp, sig) => {
    
    try {
        // convert json object to Buffer
        const dataBuffer = Buffer.from(JSON.stringify(data));

        // convert string to number
        const timestampBuffer = utils.toBuffer(timestamp);

        // compute hash
        const msgHash = utils.sha256(rlp.encode([dataBuffer, timestampBuffer]));

        // compute publicKey
        const v = sig.v;
        const senderPubKey = utils.ecrecover(msgHash, v, Buffer.from(sig.r, "hex"), Buffer.from(sig.s, "hex"));

        // check public key
        if (publicKey.toString('hex') !== senderPubKey.toString('hex')) {
            return false;
        }

        // verify
        if (!utils.ecverify(msgHash, Buffer.from(sig.r, "hex"), Buffer.from(sig.s, "hex"), senderPubKey)) {
            return false
        }
    }
    catch (e) {
        return false;
    }

    return true;
}

app.post("/unl", (req, res) => {
    unlDb.getUnl().then(unl => {
        res.send({
            code: SUCCESS,
            data: unl
        })
    }).catch(e => {
        res.send({
            code: OTH_ERR,
            data: e.toString()
        })
    })
})

app.use((req, res) => {
    if (req.url.includes("addNodes")
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

        if (!req.body.timestamp) {
            return res.send({
                code: PARAM_ERR,
                msg: "param error, need timestamp"
            });
        }

        if (!req.body.sig) {
            return res.send({
                code: PARAM_ERR,
                msg: "param error, need sig"
            });
        }

        
        if (!verifySignature(req.body.data, req.body.timestamp, req.body.sig)) {
            return res.send({
                code: OTH_ERR,
                msg: "invalid sig"
            });
        }

        //
        const options = {
            method: "POST",
            uri: `http://${host}:${port}${req.url}`,
            body: {
                
            },
            json: true
        };
        
        if (req.url.includes("addNodes") || req.url.includes("updateNodes") || req.url.includes("deleteNodes"))
        {
            options.body.nodes = req.body.data
        }
        else if(req.url.includes("perishNode"))
        {
            options.body.address = req.body.data
        }
        else if(req.url.includes("pardonNodes"))
        {
            options.body.addresses = req.body.data
        }

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