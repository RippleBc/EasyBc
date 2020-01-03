const utils = require("../../depends/utils");
const { sendTransactions } = require("../local/tx");
const assert = require("assert");
const { SUCCESS, OTH_ERR, PARAM_ERR } = require("../../constant");
const CopyRightConstract = require("../../consensus_constracts/copyRightConstract");
const { getAccountInfo } = require("../remote")
const copyRightConstractId = require("../../consensus_constracts/copyRightConstract").id;
const { COMMAND_STATIC_CREATE } = require("../../consensus_constracts/constant");

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

const COMMAND_TRANSFER = 100;

app.get("/createCopyRightConstract", (req, res) => {
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

  if (!req.query.owner) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need owner"
    });
  }

  if (!req.query.contentDigest) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need contentDigest"
    });
  }

  const privateKey = createPrivateKey();
  const publicKey = privateToPublic(privateKey);
  const to = publicToAddress(publicKey)

  const data = rlp.encode([
    toBuffer(COMMAND_STATIC_CREATE),
    Buffer.from(copyRightConstractId, "hex"),
    Buffer.from(req.query.owner, "hex"),
    Buffer.from(req.query.contentDigest, "hex")]).toString("hex");

  sendTransactions(req.query.url, req.query.from, [to.toString("hex"), req.query.value, data], req.query.privateKey).then(([transactionHash]) => {
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

app.get("/getCopyRightConstract", (req, res) => {
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
        msg: "constract not exist"
      })
    }

    const constractId = rlp.decode(account.data)[0].toString("hex");
    if (constractId !== CopyRightConstract.id) {
      return res.json({
        code: OTH_ERR,
        msg: "constract exist, but is not CopyRightConstract"
      })
    }

    const copyRightConstract = new CopyRightConstract(account.data);

    res.json({
      code: SUCCESS,
      data: {
        address: `0x${req.query.address}`,
        nonce: `0x${account.nonce.toString("hex")}`,
        balance: `0x${account.balance.toString("hex")}`,
        id: `0x${copyRightConstract.id.toString("hex")}`,
        state: bufferToInt(copyRightConstract.state),
        timestamp: bufferToInt(copyRightConstract.timestamp),
        owner: `0x${copyRightConstract.owner.toString("hex")}`,
        contentDigest: `0x${copyRightConstract.contentDigest.toString("hex")}`,
      }
    })
  }).catch(e => {
    res.json({
      code: OTH_ERR,
      msg: `getCopyRightConstract throw exception, ${e}`
    })
  })
})

app.get("/transferCopyRightConstract", (req, res) => {
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

  if (!req.query.owner) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need owner"
    });
  }

  const data = rlp.encode([
    toBuffer(COMMAND_TRANSFER),
    Buffer.from(req.query.owner, "hex")]).toString("hex");

  sendTransactions(req.query.url, req.query.from, [req.query.to, req.query.value, data], req.query.privateKey).then(([transactionHash]) => {
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