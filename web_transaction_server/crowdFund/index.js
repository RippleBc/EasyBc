const utils = require("../../depends/utils");
const { sendTransaction } = require("../local");
const assert = require("assert");
const { QUERY_MAX_LIMIT, SUCCESS, OTH_ERR, PARAM_ERR } = require("../../constant");
const CrowdFundContract = require("../../consensus_contracts/crowdFundContract");
const { getAccountInfo } = require("../remote")
const crowdFundContractId = require("../../consensus_contracts/crowdFundContract").id;
const { COMMAND_CREATE } = require("../../consensus_contracts/constant");

const app = process[Symbol.for("app")];
const printErrorStack = process[Symbol.for("printErrorStack")];

const Buffer = utils.Buffer;
const BN = utils.BN;
const rlp = utils.rlp;
const toBuffer = utils.toBuffer;

app.get("/createCrowdFundContract", (req, res) => {
  if (!req.query.url) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need url"
    });
  }

  if (!req.query.from) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need from"
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

  const data = rlp.encode([toBuffer(COMMAND_CREATE), Buffer.from(crowdFundContractId, "hex"), toBuffer(parseInt(req.query.beginTime)), toBuffer(parseInt(req.query.endTime)), 
    Buffer.from(req.query.receiveAddress, "hex"), toBuffer(parseInt(req.query.target)), 
    toBuffer(parseInt(req.query.limit))]).toString("hex");

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
    if(new BN(account.balance).eqn(0))
    {
      return res.json({
        code: OTH_ERR,
        msg: "contract not exist"
      })
    }

    const contractId = rlp.decode(account.data)[0].toString("hex");
    if (contractId !== CrowdFundContract.id)
    {
      return res.json({
        code: OTH_ERR,
        msg: "contract exist, but is not CrowdFundContract"
      })
    }

    res.json(Object.assign({
      address: req.query.address,
      nonce: account.nonce.toString("hex"),
      balance: account.balance.toString("hex"),
    }, new CrowdFundContract(account.data).toJSON()))
  }).catch(e => {
    res.json({
      code: OTH_ERR,
      msg: `getCrowdFundContract throw exception, ${e}`
    })
  })
})