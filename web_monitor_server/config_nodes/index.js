const app = process[Symbol.for('app')];
const rp = require("request-promise");
const utils = require("../../depends/utils");
const { SUCCESS, OTH_ERR, PARAM_ERR } = require("../../constant")

const Buffer = utils.Buffer;
const rlp = utils.rlp;

/**
 * 
 * @param {JSON Object} data 
 * @param {Buffer} privateKey 
 */
const sign = (data, privateKey) => {
    const timestamp = Date.now();

    // convert json object to Buffer
    const dataBuffer = Buffer.from(JSON.stringify(data))

    // convert int to Buffer
    const timestampBuffer = utils.toBuffer(timestamp)

    // compute hash
    const hash = utils.sha256(rlp.encode([dataBuffer, timestampBuffer]));

    // compute sig
    const sig = utils.ecsign(hash, privateKey)
    sig.r = sig.r.toString("hex");
    sig.s = sig.s.toString("hex");

    return { timestamp, sig }
}

app.use((req, res, next) => {
    if (req.url.includes("unl")
        || req.url.includes("addNodes")
        || req.url.includes("updateNodes")
        || req.url.includes("deleteNodes")
        || req.url.includes("perishNode")
        || req.url.includes("pardonNodes")) {

        if(!req.body.url)
        {
            return res.send({
                code: PARAM_ERR,
                msg: "param error, need url"
            }); 
        }

        //
        const options = {
            method: "POST",
            uri: `${req.body.url}${req.url}`,
            body: {
                
            },
            json: true
        };

        if(req.url.includes("addNodes")
        || req.url.includes("updateNodes")
        || req.url.includes("deleteNodes")
        || req.url.includes("perishNode")
        || req.url.includes("pardonNodes"))
        {
            if (!req.body.data) {
                return res.send({
                    code: PARAM_ERR,
                    msg: "param error, need data"
                });
            }
            
            if (!req.body.privateKey) {
                return res.send({
                    code: PARAM_ERR,
                    msg: "param error, need privateKey"
                });
            }

            // check privateKey
            if(!utils.isValidPrivate(Buffer.from(req.body.privateKey, 'hex')))
            {
                return res.send({
                    code: PARAM_ERR,
                    msg: "param error, invalid privateKey"
                });
            }

            const { timestamp, sig } = sign(req.body.data, Buffer.from(req.body.privateKey, "hex"))

            options.body = {
                data: req.body.data,
                timestamp: timestamp,
                sig: sig
            }
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