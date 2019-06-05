const utils = require("../depends/utils")
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../constant")
const Account = require("../depends/account");
const Block = require("../depends/block");
const rp = require("request-promise");
const assert = require("assert");

/**
 * @param {String} url
 * @param {String} tx
 */
module.exports.sendTransaction = async function(url, tx)
{
	assert(typeof url === "string", `net sendTransaction, url should be a String, now is ${typeof url}`);
	assert(typeof tx === "string", `net sendTransaction, tx should be a String, now is ${typeof tx}`);

	const options = {
    method: "POST",
    uri: `${url}/sendTransaction`,
    body: {
			tx: tx
    },
    json: true
	};
	
	const promise = new Promise((resolve, reject) => {
		rp(options).then(response => {
			if(response.code !== SUCCESS)
			{
				reject(response.msg);
			}

			resolve();
		}).catch(e => {
			reject(e.toString());
		});
	});

	return promise;
}

/**
 * @param {String} url
 * @param {String} transactionHash
 */
module.exports.getTransactionState = async function(url, transactionHash)
{
	assert(typeof url === "string", `net getTransactionState, url should be a String, now is ${typeof url}`);
	assert(typeof transactionHash === "string", `net getTransactionState, transactionHash should be a String, now is ${typeof transactionHash}`);

	const options = {
    method: "POST",
    uri: `${url}/getTransactionState`,
    body: {
			hash: transactionHash
		},
    json: true
	};

	const promise = new Promise((resolve, reject) => {
		rp(options).then(response => {
			if(response.code !== SUCCESS)
			{
				reject(response.msg);
			}

			resolve(response.data);
		}).catch(e => {
			reject(e.toString());
		});
	});

	return promise;
}

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

/**
 * @param {String} url
 */
module.exports.getLastestBlock = async function(url)
{
	assert(typeof url === "string", `net getAccountInfo, url should be a String, now is ${typeof url}`);

	const options = {
    method: "POST",
    uri: `${url}/getLastestBlock`,
    body: {
			
		},
    json: true
	};

	const promise = new Promise((resolve, reject) => {
		rp(options).then(response => {
			if(response.code !== SUCCESS)
			{
				reject(response.msg);
			}

			resolve(new Block(response.data ? `0x${response.data}` : undefined));
		}).catch(e => {
			reject(e);
		})
	});

	return promise;
}

module.exports.getTransactions = async function(url, hash, from, to, beginTime, endTime) {
	assert(typeof url === "string", `net getTransactions, url should be a String, now is ${typeof url}`);

	const options = {
    method: "POST",
    uri: `${url}/getTransactions`,
    body: {
			from: from
		},
    json: true
	};

	if(hash)
	{
		options.body.hash = hash
		assert(typeof hash === "string", `net getTransactions, hash should be a String, now is ${typeof hash}`);
	}
	if(from)
	{
		options.body.from = from
		assert(typeof from === "string", `net getTransactions, from should be a String, now is ${typeof from}`);
	}
	if(to)
	{
		options.body.to = to
		assert(typeof to === "string", `net getTransactions, to should be a String, now is ${typeof to}`);
	}
	if(beginTime)
	{
		assert(/^\d+$/.test(beginTime), `net getTransactions, beginTime should be a Number, now is ${typeof beginTime}`);
		options.body.beginTime = parseInt(beginTime)
	}
	if(endTime)
	{
		assert(/^\d+$/.test(endTime), `net getTransactions, endTime should be a Number, now is ${typeof endTime}`);
		options.body.endTime = parseInt(endTime)
	}

	const promise = new Promise((resolve, reject) => {
		rp(options).then(response => {
			if(response.code !== SUCCESS)
			{
				reject(response.msg);
			}

			resolve(response.data);
		}).catch(e => {
			reject(e);
		})
	});

	return promise;
}