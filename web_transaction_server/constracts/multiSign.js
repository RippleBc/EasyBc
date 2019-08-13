const utils = require("../../depends/utils");
const { sendTransaction } = require("../local");
const assert = require("assert");
const { SUCCESS, OTH_ERR, PARAM_ERR } = require("../../constant");
const CrowdFundConstract = require("../../consensus_contracts/crowdFundConstract");
const { getAccountInfo } = require("../remote")
const crowdFundConstractId = require("../../consensus_contracts/crowdFundConstract").id;
const { COMMAND_CREATE } = require("../../consensus_contracts/constant");

const app = process[Symbol.for("app")];
const printErrorStack = process[Symbol.for("printErrorStack")];

const Buffer = utils.Buffer;
const BN = utils.BN;
const rlp = utils.rlp;
const toBuffer = utils.toBuffer;
const createPrivateKey = utils.createPrivateKey;
const privateToPublic = utils.privateToPublic;
const publicToAddress = utils.publicToAddress;
const bufferToInt = utils.bufferToInt;

const COMMAND_FUND = 100;
const COMMAND_REFUND = 101;
const COMMAND_RECEIVE = 102;

app.get("/createCrowdFundContract", (req, res) => {
    if (!req.query.url) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need url"
        });
    }

    if (!req.query.value) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need value"
        });
    }

    if (!req.query.beginTime) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need beginTime"
        });
    }

    if (!req.query.endTime) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need endTime"
        });
    }

    if (!req.query.receiveAddress) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need receiveAddress"
        });
    }

    if (!req.query.target) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need target"
        });
    }

    if (!req.query.limit) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need limit"
        });
    }

    assert(/^\d+$/.test(req.query.beginTime), `getAccounts req.query.beginTime should be a Number, now is ${typeof req.query.beginTime}`);
    assert(/^\d+$/.test(req.query.endTime), `getAccounts req.query.endTime should be a Number, now is ${typeof req.query.endTime}`);
    assert(req.query.receiveAddress.length === 40, `getAccounts req.query.receiveAddress's should be 40 now is ${req.query.receiveAddress.length}`);
    assert(/^\d+$/.test(req.query.target), `getAccounts req.query.target should be a Number, now is ${typeof req.query.target}`);
    assert(/^\d+$/.test(req.query.limit), `getAccounts req.query.limit should be a Number, now is ${typeof req.query.limit}`);

    const privateKey = createPrivateKey();
    const publicKey = privateToPublic(privateKey);
    const to = publicToAddress(publicKey)

    const data = rlp.encode([toBuffer(COMMAND_CREATE), Buffer.from(crowdFundConstractId, "hex"), toBuffer(parseInt(req.query.beginTime)), toBuffer(parseInt(req.query.endTime)),
    Buffer.from(req.query.receiveAddress, "hex"), toBuffer(parseInt(req.query.target)),
    toBuffer(parseInt(req.query.limit))]).toString("hex");

    sendTransaction(req.query.url, req.query.from, to.toString("hex"), req.query.value, data, req.query.privateKey).then(transactionHash => {
        res.send({
            code: SUCCESS,
            data: {
                txHash: transactionHash,
                ctAddress: to.toString("hex")
            }
        });
    }).catch(e => {
        printErrorStack(e);

        res.send({
            code: OTH_ERR,
            msg: e.toString()
        });
    })
});

app.get("/getCrowdFundContract", (req, res) => {
    if (!req.query.url) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need url"
        });
    }

    if (!req.query.address) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need address"
        });
    }

    getAccountInfo(req.query.url, req.query.address).then(account => {
        if (new BN(account.balance).eqn(0) && new BN(account.nonce).eqn(0) && account.data.length <= 0) {
            return res.json({
                code: OTH_ERR,
                msg: "contract not exist"
            })
        }

        const contractId = rlp.decode(account.data)[0].toString("hex");
        if (contractId !== CrowdFundConstract.id) {
            return res.json({
                code: OTH_ERR,
                msg: "contract exist, but is not CrowdFundConstract"
            })
        }

        const crowdFundConstract = new CrowdFundConstract(account.data);

        res.json({
            code: SUCCESS,
            data: {
                address: req.query.address,
                nonce: bufferToInt(account.nonce),
                balance: bufferToInt(account.balance),
                id: crowdFundConstract.id.toString("hex"),
                state: bufferToInt(crowdFundConstract.state),
                beginTime: bufferToInt(crowdFundConstract.beginTime),
                endTime: bufferToInt(crowdFundConstract.endTime),
                receiveAddress: crowdFundConstract.receiveAddress.toString("hex"),
                target: bufferToInt(crowdFundConstract.target),
                limit: bufferToInt(crowdFundConstract.limit),
                fundInfo: crowdFundConstract.fundInfo.length > 0 ? rlp.decode(crowdFundConstract.fundInfo).map(entry => {
                    return [
                        `0x${entry[0].toString()}`,
                        `0x${entry[1].toString("hex")}`
                    ]
                }) : [],
            }
        })
    }).catch(e => {
        res.json({
            code: OTH_ERR,
            msg: `getCrowdFundContract throw exception, ${e}`
        })
    })
})

app.get("/fundCrowdFundContract", (req, res) => {
    if (!req.query.url) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need url"
        });
    }

    if (!req.query.to) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need to"
        });
    }

    if (!req.query.value) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need value"
        });
    }

    const data = rlp.encode([toBuffer(COMMAND_FUND)]).toString("hex");

    sendTransaction(req.query.url, req.query.from, req.query.to, req.query.value, data, req.query.privateKey).then(transactionHash => {
        res.send({
            code: SUCCESS,
            data: transactionHash
        });
    }).catch(e => {
        printErrorStack(e);

        res.send({
            code: OTH_ERR,
            msg: e.toString()
        });
    })
});

app.get("/reFundCrowdFundContract", (req, res) => {
    if (!req.query.url) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need url"
        });
    }

    if (!req.query.to) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need to"
        });
    }

    if (!req.query.value) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need value"
        });
    }

    const data = rlp.encode([toBuffer(COMMAND_REFUND)]).toString("hex");

    sendTransaction(req.query.url, req.query.from, req.query.to, req.query.value, data, req.query.privateKey).then(transactionHash => {
        res.send({
            code: SUCCESS,
            data: transactionHash
        });
    }).catch(e => {
        printErrorStack(e);

        res.send({
            code: OTH_ERR,
            msg: e.toString()
        });
    })
});

app.get("/receiveCrowdFundContract", (req, res) => {
    if (!req.query.url) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need url"
        });
    }

    if (!req.query.to) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need to"
        });
    }

    if (!req.query.value) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need value"
        });
    }

    const data = rlp.encode([toBuffer(COMMAND_RECEIVE)]).toString("hex");

    sendTransaction(req.query.url, req.query.from, req.query.to, req.query.value, data, req.query.privateKey).then(transactionHash => {
        res.send({
            code: SUCCESS,
            data: transactionHash
        });
    }).catch(e => {
        printErrorStack(e);

        res.send({
            code: OTH_ERR,
            msg: e.toString()
        });
    })
});