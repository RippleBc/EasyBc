const utils = require("../../depends/utils");
const assert = require("assert");
const { Account: AccountModel, TransactionsHistory: TransactionsHistoryModel } = process[Symbol.for("models")];
const { QUERY_MAX_LIMIT, SUCCESS, OTH_ERR, PARAM_ERR } = require("../../constant");


const app = process[Symbol.for("app")];
const printErrorStack = process[Symbol.for("printErrorStack")];

const Buffer = utils.Buffer;

app.get("/importAccount", function (req, res) {
  if (!req.query.privateKey) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need privateKey"
    });
  }

  const privateKey = Buffer.from(req.query.privateKey, "hex");

  if (!utils.isValidPrivate(privateKey)) {
    res.send({
      code: OTH_ERR,
      msg: "importAccount, invalid privateKey"
    });
  }

  saveAccount(privateKey).then(() => {
    res.send({
      code: SUCCESS
    });
  }).catch(e => {
    printErrorStack(e);

    res.send({
      code: OTH_ERR,
      msg: e.toString()
    });
  });
});

app.get("/generateKeyPiar", function (req, res) {
  let privateKey = utils.createPrivateKey();

  let address;

  (async () => {
    if (req.query.cacheAccount) {
      address = await saveAccount(privateKey);
    }
    else {
      const publicKey = utils.privateToPublic(privateKey);
      address = utils.publicToAddress(publicKey).toString("hex");
    }

    return { address, privateKey: privateKey.toString("hex") }
  })().then(({ address, privateKey }) => {
    res.send({
      code: SUCCESS,
      data: {
        address: address,
        privateKey: privateKey
      }
    });
  }).catch(e => {
    printErrorStack(e);

    res.send({
      code: OTH_ERR,
      msg: e.toString()
    });
  });
});

app.get("/getPrivateKey", function (req, res) {
  if (!req.query.address) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need address"
    });
  }

  assert(typeof req.query.address === "string", `getPrivateKey req.query.address should be a String, now is ${typeof req.query.address}`);

  (async () => {
    const privateKey = await AccountModel.findOne({
      attributes: ["privateKey"],
      where: {
        address: req.query.address
      }
    })

    if (privateKey === undefined || privateKey === null) {
      await Promise.reject(`address: ${address} has no corresponding privateKey`)
    }

    return privateKey.privateKey;
  })().then(privateKey => {
    res.send({
      code: SUCCESS,
      data: privateKey
    });
  }).catch(e => {
    printErrorStack(e);

    res.send({
      code: OTH_ERR,
      msg: e.toString()
    });
  });
})

app.get("/getAccounts", function (req, res) {
  if (!req.query.offset) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need offset"
    });
  }

  if (!req.query.limit) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need limit"
    });
  }

  assert(/^\d+$/.test(req.query.offset), `getAccounts req.query.offset should be a Number, now is ${typeof req.query.offset}`);
  assert(/^\d+$/.test(req.query.limit), `getAccounts req.query.limit should be a Number, now is ${typeof req.query.limit}`);

  if (parseInt(req.query.limit) > QUERY_MAX_LIMIT) {
    return res.send({
      code: OTH_ERR,
      msg: `limit should little or equal to ${QUERY_MAX_LIMIT}, now is ${req.query.limit}`
    })
  }

  (async () => {
    const accounts = await AccountModel.findAll({
      attributes: ["address"],
      offset: parseInt(req.query.offset),
      limit: parseInt(req.query.limit),
      order: [['id', 'DESC']]
    })

    return accounts.map(account => {
      return account.address;
    });
  })().then(accounts => {
    res.send({
      code: SUCCESS,
      data: accounts
    });
  }).catch(e => {
    printErrorStack(e);

    res.send({
      code: OTH_ERR,
      msg: e.toString()
    });
  });
});

app.get("/getFromHistory", function (req, res) {
  if (!req.query.offset) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need offset"
    });
  }

  if (!req.query.limit) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need limit"
    });
  }

  assert(/^\d+$/.test(req.query.offset), `getFromHistory req.query.offset should be a Number, now is ${typeof req.query.offset}`);
  assert(/^\d+$/.test(req.query.limit), `getFromHistory req.query.limit should be a Number, now is ${typeof req.query.limit}`);

  if (parseInt(req.query.limit) > QUERY_MAX_LIMIT) {
    return res.send({
      code: OTH_ERR,
      msg: `limit should little or equal to ${QUERY_MAX_LIMIT}, now is ${req.query.limit}`
    })
  }

  (async () => {
    const froms = await TransactionsHistoryModel.findAll({
      attributes: ["from"],
      offset: parseInt(req.query.offset),
      limit: parseInt(req.query.limit),
      order: [['id', 'DESC']]
    });

    // get addresses
    let addresses = froms.map(from => {
      return from.from;
    })

    // filter same address
    return [...new Set(addresses)];
  })().then(fromHistory => {
    res.send({
      code: SUCCESS,
      data: fromHistory
    });
  }).catch(e => {
    printErrorStack(e);

    res.send({
      code: OTH_ERR,
      msg: e.toString()
    });
  });
});

app.get("/getToHistory", function (req, res) {
  if (!req.query.offset) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need offset"
    });
  }

  if (!req.query.limit) {
    return res.send({
      code: PARAM_ERR,
      msg: "param error, need limit"
    });
  }

  assert(/^\d+$/.test(req.query.offset), `getToHistory req.query.offset should be a Number, now is ${typeof req.query.offset}`);
  assert(/^\d+$/.test(req.query.limit), `getToHistory req.query.limit should be a Number, now is ${typeof req.query.limit}`);

  if (parseInt(req.query.limit) > QUERY_MAX_LIMIT) {
    return res.send({
      code: OTH_ERR,
      msg: `limit should little or equal to ${QUERY_MAX_LIMIT}, now is ${req.query.limit}`
    })
  }

  (async () => {
    const tos = await TransactionsHistoryModel.findAll({
      attributes: ["to"],
      offset: parseInt(req.query.offset),
      limit: parseInt(req.query.limit),
      order: [['id', 'DESC']]
    })

    // get addresses
    let addresses = tos.map(to => {
      return to.to;
    })

    // filter same address
    return [...new Set(addresses)];
  })().then(toHistory => {
    res.send({
      code: SUCCESS,
      data: toHistory
    });
  }).catch(e => {
    printErrorStack(e);

    res.send({
      code: OTH_ERR,
      msg: e.toString()
    });
  });
});

/**
 * @param {Buffer} privateKey
 * @return {String} address
 */
async function saveAccount(privateKey) {
  assert(Buffer.isBuffer(privateKey), `saveAccount, privateKey should be an Buffer, now is ${typeof privateKey}`);

  const publicKey = utils.privateToPublic(privateKey);
  const address = utils.publicToAddress(publicKey)

  await AccountModel.create({
    privateKey: privateKey.toString("hex"),
    address: address.toString("hex")
  })

  return address.toString("hex")
}