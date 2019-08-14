const utils = require("../../depends/utils");
const { sendTransaction } = require("../local");
const assert = require("assert");
const { SUCCESS, OTH_ERR, PARAM_ERR } = require("../../constant");
const CrowdFundConstract = require("../../consensus_constracts/crowdFundConstract");
const { getAccountInfo } = require("../remote")
const crowdFundConstractId = require("../../consensus_constracts/crowdFundConstract").id;
const { COMMAND_CREATE } = require("../../consensus_constracts/constant");

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

app.get("/createCrowdFundConstract", (req, res) => {
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

  const privateKey = createPrivateKey();
  const publicKey = privateToPublic(privateKey);
  const to = publicToAddress(publicKey)

  const data = rlp.encode([
    toBuffer(COMMAND_CREATE), 
    Buffer.from(crowdFundConstractId, "hex"), 
    toBuffer(parseInt(req.query.beginTime)), 
    toBuffer(parseInt(req.query.endTime)), 
    Buffer.from(req.query.receiveAddress, "hex"), 
    Buffer.from(req.query.target, "hex"), 
    Buffer.from(req.query.limit, "hex")]).toString("hex");

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

app.get("/getCrowdFundConstract", (req, res) => {
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
    if (new BN(account.balance).eqn(0) && new BN(account.nonce).eqn(0) && account.data.length <= 0)
    {
      return res.json({
        code: OTH_ERR,
        msg: "constract not exist"
      })
    }

    const constractId = rlp.decode(account.data)[0].toString("hex");
    if (constractId !== CrowdFundConstract.id)
    {
      return res.json({
        code: OTH_ERR,
        msg: "constract exist, but is not CrowdFundConstract"
      })
    }

    const crowdFundConstract = new CrowdFundConstract(account.data);

    res.json({
      code: SUCCESS,
      data: {
        address: `0x${req.query.address}`,
        nonce: `0x${account.nonce.toString("hex")}`,
        balance: `0x${account.balance.toString("hex")}`,
        id: `0x${crowdFundConstract.id.toString("hex")}`,
        state: bufferToInt(crowdFundConstract.state),
        beginTime: bufferToInt(crowdFundConstract.beginTime),
        endTime: bufferToInt(crowdFundConstract.endTime),
        receiveAddress: `0x${crowdFundConstract.receiveAddress.toString("hex")}`,
        target: `0x${crowdFundConstract.target.toString("hex")}`,
        limit: `0x${crowdFundConstract.limit.toString("hex")}`,
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
      msg: `getCrowdFundConstract throw exception, ${e}`
    })
  })
})

app.get("/fundCrowdFundConstract", (req, res) => {
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

app.get("/reFundCrowdFundConstract", (req, res) => {
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

app.get("/receiveCrowdFundConstract", (req, res) => {
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