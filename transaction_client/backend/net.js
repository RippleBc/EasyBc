const utils = require("../../depends/utils")
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../../constant")
const Account = require("../../depends/account");
const Block = require("../../depends/block");
const rp = require("request-promise");
const assert = require("assert");

const options = {
    method: "POST",
    uri: "",
    body: {
        
    },
    json: true // Automatically stringifies the body to JSON
};

/**
 * @param {String} url
 * @param {String} tx
 */
module.exports.sendTransaction = async function(url, tx)
{
	assert(typeof url === "string", `chat sendTransaction, url should be a String, now is ${typeof url}`);
	assert(typeof tx === "string", `chat sendTransaction, tx should be a String, now is ${typeof tx}`);

	tx = `0x${utils.padToEven(tx)}`;

	options.uri = `${url}/sendTransaction`;
	options.body = {
		tx: tx
	}
	
	const response = await rp(options);
	if(response.code !== SUCCESS)
	{
		await Promise.reject(response.msg);
	}
}

/**
 * @param {String} url
 * @param {String} transactionHash
 */
module.exports.getTransactionState = async function(url, transactionHash)
{
	assert(typeof url === "string", `chat getTransactionState, url should be a String, now is ${typeof url}`);
	assert(typeof transactionHash === "string", `chat getTransactionState, transactionHash should be a String, now is ${typeof transactionHash}`);

	transactionHash = `0x${utils.padToEven(transactionHash)}`;

	options.uri = `${url}/getTransactionState`;
	options.body = {
		hash: transactionHash
	}

	const reponse = await rp(options);
	if(response.code !== SUCCESS)
	{
		await Promise.reject(response.msg);
	}

	return response.data;
}

/**
 * @param {String} url
 * @param {String} address
 */
module.exports.getAccountInfo = async function(url, address)
{
	assert(typeof url === "string", `chat getAccountInfo, url should be a String, now is ${typeof url}`);
	assert(typeof address === "string", `chat getAccountInfo, address should be a String, now is ${typeof address}`);

	address = `0x${utils.padToEven(address)}`;

	options.uri = `${url}/getAccountInfo`;
	options.body = {
		address: address
	}

	const reponse = await rp(options);
	if(response.code !== SUCCESS)
	{
		await Promise.reject(response.msg);
	}

	return new Account(response.data);
}

/**
 * @param {String} url
 */
module.exports.getLastestBlock = async function(url)
{
	assert(typeof url === "string", `chat getAccountInfo, url should be a String, now is ${typeof url}`);

	options.uri = `${url}/getLastestBlock`;

	const response = await rp(options);
	if(response.code !== SUCCESS)
	{
		await Promise.reject(response.msg);
	}

	if(response.data)
	{
		return new Block(response.data);
	}
	
	return new Block();
}