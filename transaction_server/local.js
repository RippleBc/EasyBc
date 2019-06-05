const levelup = require("levelup");
const leveldown = require("leveldown");
const Trie = require("merkle-patricia-tree");
const path = require("path");
const utils = require("../depends/utils");
const Transaction = require("../depends/transaction");
const { sendTransaction, getAccountInfo } = require("./remote");
const assert = require("assert");

const rlp = utils.rlp;
const Buffer = utils.Buffer;
const BN = utils.BN;

const { Account: AccountModel, TransactionsHistory: TransactionsHistoryModel } = process[Symbol.for("models")];

/**
 * @param {String} privateKey
 */
exports.importAccount = async function(privateKey)
{
	assert(typeof privateKey === "string", `importAccount privateKey should be a String, now is ${typeof privateKey}`);

	privateKey = Buffer.from(privateKey, "hex");

	if(!utils.isValidPrivate(privateKey))
	{
		await Promise.reject("importAccount, invalid privateKey");
	}

	return await saveAccount(privateKey);
}

/**
 * @return {Number} offset
 * @return {Array}
 */
exports.getAccounts = async function(offset)
{
	assert(/^\d+$/.test(offset), `getAccounts offset should be a Number, now is ${typeof offset}`);

	offset = parseInt(offset)

	const accounts = await AccountModel.findAll({
		attributes: ["address"],
		offset: offset,
		limit: 100,
		order: [['id', 'DESC']]
	})

	return accounts.map(account => {
		return account.address;
	});
}

/**
 * @return {Object}
 *   @prop {String} address
 *   @prop {String} privateKey 
 */
exports.generateKeyPiar = async function()
{
	let privateKey = utils.createPrivateKey();
	
	const address = await saveAccount(privateKey);

	return { address, privateKey: privateKey.toString("hex") }
}

/**
 * @param {String} address
 * @return {String}
 */
exports.getPrivateKey = async function(address)
{
	assert(typeof address === "string", `getPrivateKey address should be a String, now is ${typeof address}`);

	const privateKey = await AccountModel.findOne({
		attributes: ["privateKey"],
		where: {
			address: address
		}
	})

	if(privateKey === undefined || privateKey === null)
	{
		await Promise.reject(`address: ${address} has no corresponding privateKey`)
	}

	return privateKey.privateKey;
}

/**
 * @return {Number} offset
 * @return {Array}
 */
exports.getFromHistory = async function(offset)
{
	assert(/^\d+$/.test(offset), `getFromHistory offset should be a Number, now is ${typeof offset}`);

	offset = parseInt(offset)

	const froms = await TransactionsHistoryModel.findAll({
		attributes: ["from"],
		offset: offset,
		limit: 100,
		order: [['id', 'DESC']]
	});

	return froms.map(from => {
		return from.from;
	})
}

/**
 * @return {Number} offset
 * @return {Array}
 */
exports.getToHistory = async function(offset)
{
	assert(/^\d+$/.test(offset), `getFromHistory offset should be a Number, now is ${typeof offset}`);

	offset = parseInt(offset)

	const tos =  await TransactionsHistoryModel.findAll({
		attributes: ["to"],
		offset: offset,
		limit: 100,
		order: [['id', 'DESC']]
	})

	return tos.map(to => {
		return to.to;
	})
}

/**
 * @param {String} url
 * @param {String|Undefined} privateKey
 * @param {String|Undefined} from
 * @param {String} to
 * @param {String} value
 * @return {String}
 */
exports.sendTransaction = async function(url, privateKey, from, to, value)
{
	assert(typeof url === "string", `sendTransaction, url should be a String, now is ${typeof url}`);

	if(privateKey)
	{
		assert(typeof privateKey === "string", `sendTransaction, privateKey should be an String, now is ${typeof privateKey}`);
		if(privateKey.length !== 64)
		{
			await Promise.reject("sendTransaction, invalid privateKey");
		}
	}
	if(from)
	{
		assert(typeof from === "string", `sendTransaction, from should be an String, now is ${typeof from}`);
		if(from.length !== 40)
		{
			await Promise.reject("sendTransaction, invalid from address");
		}
	}
	assert(typeof to === "string", `sendTransaction, to should be an String, now is ${typeof to}`);
	assert(typeof value === "string", `sendTransaction, value should be an String, now is ${typeof value}`);

	if(to.length !== 40)
	{
		await Promise.reject("sendTransaction, invalid to address");
	}

	if(value === "")
	{
		await Promise.reject("sendTransaction, invalid value");
	}

	// try to get privateKey
	if(privateKey === undefined)
	{
		if(from === undefined)
		{
			await Promise.reject("sendTransaction, when privateKey is undefined, from must be supplied")
		}

		privateKey = await AccountModel.findOne({
			attributes: ["privateKey"],
			where: {
				address: from
			}
		})

		if(privateKey === undefined || privateKey === null)
		{
			await Promise.reject(`sendTransaction, from ${from}'s corresponding privateKey is not exist`)
		}

		privateKey = privateKey.privateKey;
	}
	
	// try to get from
	if(from === undefined)
	{
		const public = utils.privateToPublic(Buffer.from(privateKey, "hex"))
		from = utils.publicToAddress(public).toString("hex");
	}

	// get account
	const accountInfo =  await getAccountInfo(url, from);
	
	// init tx
	const tx = new Transaction();
	tx.nonce = (new BN(accountInfo.nonce).addn(1)).toArrayLike(Buffer);
	tx.timestamp = Date.now();
	tx.value = Buffer.from(value, "hex");
	tx.data = "";
	tx.to = Buffer.from(to, "hex");
	tx.sign(Buffer.from(privateKey, "hex"));

	// save transaction history
	await TransactionsHistoryModel.create({
		from: from,
		to: to,
		value: value
	})

	// send transaction
	await sendTransaction(url, tx.serialize().toString("hex"));

	return tx.hash().toString("hex");
}

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