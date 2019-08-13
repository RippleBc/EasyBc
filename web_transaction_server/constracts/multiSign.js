const utils = require("../../depends/utils");
const { sendTransaction } = require("../local");
const assert = require("assert");
const { SUCCESS, OTH_ERR, PARAM_ERR } = require("../../constant");
const MultiSignConstract = require("../../consensus_contracts/multiSignConstract");
const { getAccountInfo } = require("../remote")
const multiSignConstractId = require("../../consensus_contracts/multiSignConstract").id;
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

const COMMAND_SEND = 100;
const COMMAND_AGREE = 101;
const COMMAND_REJECT = 102;

app.get("/createMultiSignConstract", (req, res) => {
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

    if (!req.query.expireInverval) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need expireInverval"
        });
    }

    if (!req.query.threshold) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need threshold"
        });
    }

    if (!req.query.authorityAddresses) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need authorityAddresses"
        });
    }
    
    // check address
    req.query.authorityAddresses = JSON.parse(req.query.authorityAddresses)
    for (let authorityAddress of req.query.authorityAddresses)
    {
        if (authorityAddress.length !== 40)
        {
            return res.send({
                code: OTH_ERR,
                msg: `param error, address ${authorityAddress} at authorityAddresses is invalid`
            });
        }
    }
    const authorityAddressesBuffer = rlp.encode(req.query.authorityAddresses.map(el => Buffer.from(el, "hex")))

    const privateKey = createPrivateKey();
    const publicKey = privateToPublic(privateKey);
    const to = publicToAddress(publicKey)

    const data = rlp.encode([
        toBuffer(COMMAND_CREATE), 
        Buffer.from(multiSignConstractId, "hex"), 
        toBuffer(parseInt(req.query.expireInverval)), 
        toBuffer(parseInt(req.query.threshold)),
        authorityAddressesBuffer]).toString("hex");

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

app.get("/getMultiSignConstract", (req, res) => {
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
        if (contractId !== MultiSignConstract.id) {
            return res.json({
                code: OTH_ERR,
                msg: "contract exist, but is not MultiSignConstract"
            })
        }

        const multiSignConstract = new MultiSignConstract(account.data);

        res.json({
            code: SUCCESS,
            data: {
                address: `0x${req.query.address}`,
                nonce: `0x${account.nonce.toString("hex")}`,
                balance: `0x${account.balance.toString("hex")}`,
                id: `0x${multiSignConstract.id.toString("hex")}`,
                state: bufferToInt(multiSignConstract.state),
                timestamp: bufferToInt(multiSignConstract.timestamp),
                expireInverval: bufferToInt(multiSignConstract.expireInverval),
                to: `0x${multiSignConstract.to.toString("hex")}`,
                value: `0x${multiSignConstract.value.toString("hex")}`,
                threshold: bufferToInt(multiSignConstract.threshold),
                authorityAddresses: multiSignConstract.authorityAddresses.length > 0 ? rlp.decode(multiSignConstract.authorityAddresses).map(el => `0x${el.toString("hex")}`) : [],
                agreeAddresses: multiSignConstract.agreeAddresses.length > 0 ? rlp.decode(multiSignConstract.agreeAddresses).map(el => `0x${el.toString("hex")}`) : [],
                rejectAddresses: multiSignConstract.rejectAddresses.length > 0 ? rlp.decode(multiSignConstract.rejectAddresses).map(el => `0x${el.toString("hex")}`) : []
            }
        })
    }).catch(e => {
        res.json({
            code: OTH_ERR,
            msg: `getMultiSignConstract throw exception, ${e}`
        })
    })
})

app.get("/sendMultiSignConstract", (req, res) => {
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

    if (!req.query.contractTo) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need contractTo"
        });
    }

    if (!req.query.contractValue) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need contractValue"
        });
    }
    const data = rlp.encode([
        toBuffer(COMMAND_SEND), 
        Buffer.from(req.query.contractTo, "hex"), 
        Buffer.from(req.query.contractValue, "hex")]).toString("hex");

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

app.get("/agreeMultiSignConstract", (req, res) => {
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

    if (!req.query.timestamp) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need timestamp"
        });
    }

    const data = rlp.encode([toBuffer(COMMAND_AGREE), toBuffer(req.query.timestamp)]).toString("hex");

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

app.get("/rejectMultiSignConstract", (req, res) => {
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

    if (!req.query.timestamp) {
        return res.send({
            code: PARAM_ERR,
            msg: "param error, need timestamp"
        });
    }

    const data = rlp.encode([toBuffer(COMMAND_REJECT), toBuffer(req.query.timestamp)]).toString("hex");

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