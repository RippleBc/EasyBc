const { SUCCESS, PARAM_ERR, OTH_ERR } = require("../constant")
const Account = require("../depends/account");
const rp = require("request-promise");
const assert = require("assert");
const Block = require("../depends/block")
const utils = require("../depends/utils")

const Buffer = utils.Buffer;

const app = process[Symbol.for("app")]
const printErrorStack = process[Symbol.for("printErrorStack")];

app.use((req, res, next) => {
	if (req.url.includes("getTransactionState")
		|| req.url.includes("getTransactions")
		|| req.url.includes("getAccountInfo")
		|| req.url.includes("getLastestBlock")) {
		if (!req.query.url) {
			res.send({
				code: PARAM_ERR,
				msg: "param error, need url"
			});
			return;
		}

		if (req.query.offset)
		{
			req.query.offset = parseInt(req.query.offset)
		}
		if(req.query.limit)
		{
			req.query.limit = parseInt(req.query.limit)
		}

		if (req.query.beginTime === '' || req.query.endTime === undefined)
		{
			req.query.beginTime = 0;
		}
		else
		{
			req.query.beginTime = parseInt(req.query.beginTime)
		}

		if (req.query.endTime === '' || req.query.endTime === undefined)
		{
			req.query.endTime = Date.now()
		}
		else
		{
			req.query.endTime = parseInt(req.query.endTime)
		}

		const options = {
			method: "POST",
			uri: `${req.query.url}${req.url}`,
			body: req.query,
			json: true
		};

		rp(options).then(response => {
			if (req.url.includes("getLastestBlock"))
			{
				const block = new Block(Buffer.from(response.data, "hex"));

				return res.send({
					code: response.code,
					data: {
						hash: block.hash().toString("hex"),
						number: block.header.number.toString("hex")
					},
					msg: response.msg
				})
			}
			if (req.url.includes("getAccountInfo"))
			{
				return res.send({
					code: response.code,
					data: new Account(response.data ? `0x${response.data}` : undefined),
					msg: response.msg
				})
			}
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
	else {
		next();
	}
})

/**
 * @param {String} url
 * @param {String} address
 */
module.exports.getAccountInfo = async function(url, address)
{
	assert(typeof url === "string", `net getAccountInfo, url should be a String, now is ${typeof url}`);
	assert(typeof address === "string", `net getAccountInfo, address should be a String, now is ${typeof address}`);

	const options = {
    method: "POST",
    uri: `${url}/getAccountInfo`,
    body: {
			address: address
		},
    json: true
	};

	const promise = new Promise((resolve, reject) => {
		rp(options).then(response => {
			if(response.code !== SUCCESS)
			{
				reject(response.msg);
			}
			
			resolve(new Account(response.data ? `0x${response.data}` : undefined));
		}).catch(e => {
			reject(e);
		});
	});

	return promise;
}