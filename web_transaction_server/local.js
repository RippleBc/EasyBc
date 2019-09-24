const utils = require("../depends/utils");
const Transaction = require("../depends/transaction");
const { getAccountInfo } = require("./remote");
const assert = require("assert");
const { Account: AccountModel, TransactionsHistory: TransactionsHistoryModel } = process[Symbol.for("models")];
const { QUERY_MAX_LIMIT, SUCCESS, OTH_ERR, PARAM_ERR } = require("../constant");
const { COMMAND_TX } = require("../consensus_constracts/constant");
const rp = require("request-promise");

const app = process[Symbol.for("app")];
const printErrorStack = process[Symbol.for("printErrorStack")];

const Buffer = utils.Buffer;
const BN = utils.BN;
const toBuffer = utils.toBuffer;

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

	if (parseInt(req.query.limit) > QUERY_MAX_LIMIT)
	{
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

app.get("/sendTransaction", function (req, res) {
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
	
	let data;
	if(req.query.data)
	{
		data = utils.rlp([toBuffer(COMMAND_TX), Buffer.from(req.query.data)]).toString("hex");
	}

	module.exports.sendTransaction(req.query.url, req.query.from, req.query.to, req.query.value, data, req.query.privateKey).then(transactionHash => {
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

/**
 * @param {Buffer} privateKey
 * @return {String} address
 */
async function saveAccount(privateKey)
{
	assert(Buffer.isBuffer(privateKey), `saveAccount, privateKey should be an Buffer, now is ${typeof privateKey}`);

	const publicKey = utils.privateToPublic(privateKey);
	const address = utils.publicToAddress(publicKey)

	await AccountModel.create({
		privateKey: privateKey.toString("hex"),
		address: address.toString("hex")
	})

	return address.toString("hex")
}


/**
 * @param {String} url
 * @param {String} from
 * @param {String} to
 * @param {String} value
 * @param {String} data
 * @param {String} privateKey
 */
module.exports.sendTransaction = async(url, from, to, value, data, privateKey) => {
	// check url
	assert(typeof url === "string", `sendTransaction, url should be a String, now is ${typeof url}`);

	// check privateKey
	if (privateKey) {
		assert(typeof privateKey === "string", `sendTransaction, privateKey should be an String, now is ${typeof privateKey}`);
		if (privateKey.length !== 64) {
			await Promise.reject("sendTransaction, invalid privateKey")
		}
	}

	// check from
	if (from) {
		assert(typeof from === "string", `sendTransaction, from should be an String, now is ${typeof from}`);
		if (from.length !== 40) {
			await Promise.reject("sendTransaction, invalid from address")
		}
	}

	if(data)
	{
		assert(typeof data === "string", `sendTransaction, data should be an String, now is ${typeof data}`);
	}
	// check to
	assert(typeof to === "string", `sendTransaction, to should be an String, now is ${typeof to}`);
	if (to.length !== 40) {
		await Promise.reject("sendTransaction, invalid to address")
	}

	// check value
	assert(typeof value === "string", `sendTransaction, value should be an String, now is ${typeof value}`);
	if (value === "") {
		await Promise.reject("sendTransaction, invalid value");
	}

	if (privateKey === undefined) {
		// fetch privateKey from db according from
		if (from === undefined) {
			await Promise.reject("sendTransaction, when privateKey is undefined, from must be supplied")
		}

		({ privateKey } = await AccountModel.findOne({
			attributes: ["privateKey"],
			where: {
				address: from
			}
		}))

		if (privateKey === undefined || privateKey === null) {
			await Promise.reject(`sendTransaction, from ${from}'s corresponding privateKey is not exist`)
		}
	}
	else {
		// compute from according privateKey
		const public = utils.privateToPublic(Buffer.from(privateKey, "hex"))
		from = utils.publicToAddress(public).toString("hex");
	}

	// get account
	const accountInfo = await getAccountInfo(url, from);

	// init tx
	const tx = new Transaction();
	tx.nonce = (new BN(accountInfo.nonce).addn(1)).toArrayLike(Buffer);
	tx.timestamp = Date.now();
	tx.value = Buffer.from(value, "hex");
	tx.data = data ? Buffer.from(data, "hex") : Buffer.alloc(0);
	tx.to = Buffer.from(to, "hex");
	tx.sign(Buffer.from(privateKey, "hex"));

	// save transaction history
	await TransactionsHistoryModel.create({
		from: from,
		to: to,
		value: value
	})

	const options = {
		method: "POST",
		uri: `${url}/sendTransaction`,
		body: {
			tx: tx.serialize().toString("hex")
		},
		json: true
	};

	
	const response = await rp(options);
	if (response.code !== SUCCESS) {
		await Promise.reject(response.msg);
	}
		
	return tx.hash().toString("hex");
}