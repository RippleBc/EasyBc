const levelup = require("levelup");
const leveldown = require("leveldown");
const Trie = require("merkle-patricia-tree");
const path = require("path");
const utils = require("../../depends/utils");
const Account = require("../../depends/account");
const Transaction = require("../../depends/transaction");
const { sendTransaction, getAccountInfo } = require("./net");
const assert = require("assert");

const rlp = utils.rlp;
const Buffer = utils.Buffer;
const BN = utils.BN;

const KEY_KEY_PIAR_ARRAY = "key_piar_array";
const KEY_TO_ARRAY = "to_array";

class Db 
{
	constructor()
	{
		this.db = levelup(leveldown(path.join(__dirname, "../data")));
	}
	

	async get(key)
	{
		try
		{
			return await this.db.get(key);
		}
		catch(e)
		{
			if(e.toString().indexOf("NotFoundError: Key not found in database") >= 0)
			{
				return undefined;
			}

			await Promise.reject(`Db get, throw exception, ${e}`);
		}
	}

	async put(key, value)
	{
		await this.db.put(key, value);
	}
};

const db = new Db();

/**
 * @param {String} privateKey
 * @return {String}
 */
exports.importAccount = async function(privateKey)
{
	assert(typeof privateKey === "string", `importAccount privateKey should be a String, now is ${typeof privateKey}`);

	privateKey = Buffer.from(privateKey, "hex");

	if(!utils.isValidPrivate(privateKey))
	{
		await Promise.reject("invalid privateKey");
	}

	await saveFrom(privateKey);
}

exports.generateKeyPiar = async function()
{
	let privateKey = utils.createPrivateKey();
	const publicKey = utils.privateToPublic(privateKey);
	const address = utils.publicToAddress(publicKey)
	
	await saveFrom(privateKey);

	return { address, privateKey }
}

/**
 * @param {String} address
 * @return {String}
 */
exports.getPrivateKey = async function(address)
{
	assert(typeof address === "string", `getPrivateKey address should be a String, now is ${typeof address}`);

	const keyPairArrayRaw = await db.get(KEY_KEY_PIAR_ARRAY);
	let keyPairArray;
	if(keyPairArrayRaw)
	{
		keyPairArray = rlp.decode(keyPairArrayRaw);
	}
	else
	{
		keyPairArray = [];
	}
	

	for(let i = 0; i < keyPairArray.length; i++)
	{
		if(address === keyPairArray[i][2].toString("hex"))
		{
			return keyPairArray[i][0].toString("hex");
		}
	}

	await Promise.reject(`address ${address}'s privateKey is not exist`);
}

/**
 * @return {Array} 
 */
exports.getFromHistory = async function()
{
	const keyPairArrayRaw = await db.get(KEY_KEY_PIAR_ARRAY);
	let keyPairArray;
	if(keyPairArrayRaw)
	{
		keyPairArray = rlp.decode(keyPairArrayRaw);
	}
	else
	{
		return [];
	}
	

	const addressArray = [];
  for(let i = 0; i < keyPairArray.length; i++)
  {
  	addressArray.push(keyPairArray[i][2].toString("hex"));
  }

  return addressArray;
}

/**
 * @return {Array} 
 */
exports.getToHistory = async function()
{
	const addressArrayRaw = await db.get(KEY_TO_ARRAY);
	let addressArray;
	if(addressArrayRaw)
	{
		addressArray = rlp.decode(addressArrayRaw);
	}
	else
	{
		return [];
	}

	const addressHexArray = [];
	for(let i = 0; i < addressArray.length; i++)
	{
		addressHexArray.push(addressArray[i].toString("hex"));
	}

	return addressHexArray;
}

/**
 * @param {String} url
 * @param {Buffer} from
 * @param {Buffer} to
 * @param {Buffer} value
 * @return {String}
 */
exports.sendTransaction = async function(url, from, to, value)
{
	assert(typeof url === "string", `sendTransaction, url should be a String, now is ${typeof url}`);
	assert(Buffer.isBuffer(from), `sendTransaction, from should be an Buffer, now is ${typeof from}`);
	assert(Buffer.isBuffer(to), `sendTransaction, to should be an Buffer, now is ${typeof to}`);
	assert(Buffer.isBuffer(value), `sendTransaction, value should be an Buffer, now is ${typeof value}`);

	if(from.length !== 20)
	{
		await Promise.reject("sendTransaction, invalid from address");
	}

	if(to.length !== 20)
	{
		await Promise.reject("sendTransaction, invalid to address");
	}

	if(value.toString("hex") === "")
	{
		await Promise.reject("sendTransaction, invalid value");
	}


	// get corresponding private key
	const keyPairArrayRaw = await	db.get(KEY_KEY_PIAR_ARRAY);
	let keyPairArray;
	if(keyPairArrayRaw)
	{
		keyPairArray = rlp.decode(keyPairArrayRaw);
	}
	else
	{
		keyPairArray = [];
	}

	let keyPair;
	for(let i = 0; i < keyPairArray.length; i++)
	{
		if(keyPairArray[i][2].toString("hex") === from.toString("hex"))
		{
			keyPair = keyPairArray[i];
			break;
		}
	}
	if(!keyPair)
	{
		await Promise.reject("sendTransaction, from address not exist");
	}
	const privateKey = keyPair[0];
	const address = keyPair[2];

	// get account
	const accountInfo =  await getAccountInfo(url, address.toString("hex"));
	
	// send tx
	const tx = new Transaction();
	tx.nonce = (new BN(accountInfo.nonce).addn(1)).toArrayLike(Buffer);
	tx.timestamp = Date.now();
	tx.value = value;
	tx.data = "";
	tx.to = to;
	tx.sign(privateKey);

	await saveTo(to);
	await sendTransaction(url, tx.serialize().toString("hex"));

	return tx.hash().toString("hex");
}

/**
 * @param {Buffer} privateKey
 */
async function saveFrom(privateKey)
{
	assert(Buffer.isBuffer(privateKey), `saveFrom, privateKey should be an Buffer, now is ${typeof privateKey}`);

	const publicKey = utils.privateToPublic(privateKey);
	const address = utils.publicToAddress(publicKey)

	const keyPairArrayRaw = await db.get(KEY_KEY_PIAR_ARRAY);
	let keyPairArray;
	if(keyPairArrayRaw)
	{
		keyPairArray = rlp.decode(keyPairArrayRaw);
	}
	else
	{
		keyPairArray = [];
	} 

	// check if privateKey is exist
	for(let i = 0; i < keyPairArray.length; i++)
	{
		if(privateKey.toString("hex") === keyPairArray[i][0].toString("hex"))
		{
			return;
		}
	}

	//
	keyPairArray.push([privateKey, publicKey, address]);

	//
	await db.put(KEY_KEY_PIAR_ARRAY, rlp.encode(keyPairArray));
}

/**
 * @param {Buffer} to
 */
async function saveTo(to)
{
	assert(Buffer.isBuffer(to), `saveTo, to should be an Buffer, now is ${typeof to}`);

	const toArrayRaw = await db.get(KEY_TO_ARRAY);
	let toArray;
	if(toArrayRaw)
	{
		toArray = rlp.decode(toArrayRaw);
	}
	else
	{
		toArray = [];
	}

	for(let i = 0; i < toArray.length; i++)
	{
		if(to.toString("hex") === toArray[i].toString("hex"))
		{
			return;
		}
	}
	toArray.push(to);

	await db.put(KEY_TO_ARRAY, rlp.encode(toArray));
}