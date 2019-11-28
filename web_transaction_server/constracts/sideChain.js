const utils = require("../../depends/utils");
const { sendTransactions } = require("../local/tx");
const assert = require("assert");
const { SUCCESS, OTH_ERR, PARAM_ERR } = require("../../constant");
const SideChainConstract = require("../../consensus_constracts/sideChainConstract");
const { getAccountInfo } = require("../remote")
const SideChainConstractId = SideChainConstract.id;
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

const COMMAND_NEW_AUTHORITY_ADDRESSES = 100;
const COMMAND_DEL_AUTHORITY_ADDRESSES = 101;
const COMMAND_AGREE = 102;
const COMMAND_REJECT = 103;
const COMMAND_APPEND_GUARANTEE = 105;

app.get("/createSideChainConstract", (req, res) => {
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

  if (!req.query.code) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need code"
    });
  }

  if (!req.query.expireInterval) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need expireInterval"
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
  if (!Array.isArray(req.query.authorityAddresses)) {
    req.query.authorityAddresses = JSON.parse(req.query.authorityAddresses)
  }

  for (let authorityAddress of req.query.authorityAddresses) {
    if (authorityAddress.length !== 40) {
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
    Buffer.from(SideChainConstractId, "hex"),
    Buffer.from(req.query.code, "hex"),
    toBuffer(parseInt(req.query.expireInterval)),
    toBuffer(parseInt(req.query.threshold)),
    authorityAddressesBuffer]).toString("hex");

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

app.get("/getSideChainConstract", (req, res) => {
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
    if (constractId !== SideChainConstract.id) {
      return res.json({
        code: OTH_ERR,
        msg: "constract exist, but is not SideChainConstract"
      })
    }

    const sideChainConstract = new SideChainConstract(account.data);

    res.json({
      code: SUCCESS,
      data: {
        address: `0x${req.query.address}`,
        nonce: `0x${account.nonce.toString("hex")}`,
        balance: `0x${account.balance.toString("hex")}`,
        id: `0x${sideChainConstract.id.toString("hex")}`,
        state: bufferToInt(sideChainConstract.state),
        code: `0x${sideChainConstract.code.toString("hex")}`,
        timestamp: bufferToInt(sideChainConstract.timestamp),
        expireInterval: bufferToInt(sideChainConstract.expireInterval),
        newAuthorityAddresses: sideChainConstract.newAuthorityAddresses.length > 0 ? rlp.decode(sideChainConstract.newAuthorityAddresses).map(el => `0x${el.toString("hex")}`) : [],
        delAuthorityAddresses: sideChainConstract.delAuthorityAddresses.length > 0 ? rlp.decode(sideChainConstract.delAuthorityAddresses).map(el => `0x${el.toString("hex")}`) : [],
        threshold: bufferToInt(sideChainConstract.threshold),
        authorityAddresses: sideChainConstract.authorityAddresses.length > 0 ? rlp.decode(sideChainConstract.authorityAddresses).map(el => `0x${el.toString("hex")}`) : [],
        agreeAddresses: sideChainConstract.agreeAddresses.length > 0 ? rlp.decode(sideChainConstract.agreeAddresses).map(el => `0x${el.toString("hex")}`) : [],
        rejectAddresses: sideChainConstract.rejectAddresses.length > 0 ? rlp.decode(sideChainConstract.rejectAddresses).map(el => `0x${el.toString("hex")}`) : [],
        crossPayRequests: sideChainConstract.crossPayRequests.length > 0 ? rlp.decode(sideChainConstract.crossPayRequests).map(el => {
          if (Buffer.isBuffer(el))
          {
            return `0x${el.toString("hex")}`;
          }
          else if(Array.isArray(el))
          {
            return el.map(sponsor => `0x${sponsor.toString("hex")}`);
          }
        }) : []
      }
    })
  }).catch(e => {
    res.json({
      code: OTH_ERR,
      msg: `getSideChainConstract throw exception, ${e}`
    })
  })
})

app.get("/newSideChainConstract", (req, res) => {
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

  if (!req.query.newAuthorityAddresses) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need newAuthorityAddresses"
    });
  }

  // check address
  if (!Array.isArray(req.query.newAuthorityAddresses)) {
    req.query.newAuthorityAddresses = JSON.parse(req.query.newAuthorityAddresses)
  }

  for (let newAuthorityAddress of req.query.newAuthorityAddresses) {
    if (newAuthorityAddress.length !== 40) {
      return res.send({
        code: OTH_ERR,
        msg: `param error, address ${newAuthorityAddress} at newAuthorityAddresses is invalid`
      });
    }
  }
  const newAuthorityAddressesBuffer = rlp.encode(req.query.newAuthorityAddresses.map(el => Buffer.from(el, "hex")))

  const data = rlp.encode([
    toBuffer(COMMAND_NEW_AUTHORITY_ADDRESSES),
    newAuthorityAddressesBuffer]).toString("hex");

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

app.get("/delSideChainConstract", (req, res) => {
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

  if (!req.query.delAuthorityAddresses) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need delAuthorityAddresses"
    });
  }

  // check address
  if (!Array.isArray(req.query.delAuthorityAddresses)) {
    req.query.delAuthorityAddresses = JSON.parse(req.query.delAuthorityAddresses)
  }

  for (let delAuthorityAddress of req.query.delAuthorityAddresses) {
    if (delAuthorityAddress.length !== 40) {
      return res.send({
        code: OTH_ERR,
        msg: `param error, address ${delAuthorityAddress} at delAuthorityAddresses is invalid`
      });
    }
  }
  const delAuthorityAddressesBuffer = rlp.encode(req.query.delAuthorityAddresses.map(el => Buffer.from(el, "hex")))

  const data = rlp.encode([
    toBuffer(COMMAND_DEL_AUTHORITY_ADDRESSES),
    delAuthorityAddressesBuffer]).toString("hex");

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

app.get("/agreeSideChainConstract", (req, res) => {
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

  const data = rlp.encode([toBuffer(COMMAND_AGREE), toBuffer(parseInt(req.query.timestamp))]).toString("hex");

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

app.get("/rejectSideChainConstract", (req, res) => {
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

  const data = rlp.encode([toBuffer(COMMAND_REJECT), toBuffer(parseInt(req.query.timestamp))]).toString("hex");

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

app.get("/appendGuaranteeSideChainConstract", (req, res) => {
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

  const data = rlp.encode([toBuffer(COMMAND_APPEND_GUARANTEE)]).toString("hex");

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