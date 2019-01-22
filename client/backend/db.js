const levelup = require("levelup")
const leveldown = require("leveldown")
const Trie = require("merkle-patricia-tree")
const path = require("path")
const util = require("../../utils")
const async = require("async")
const Account = require("../../account");
const Transaction = require("../../transaction");
const {post} = require("../../http/request");
const {SUCCESS, PARAM_ERR, OTH_ERR} = require("../constant");
const log4js= require("../logConfig");
const logger = log4js.getLogger();
const errlogger = log4js.getLogger("err");
const othlogger = log4js.getLogger("oth");

const rlp = util.rlp;
const Buffer = util.Buffer;
const BN = util.BN;

const KEY_KEY_PIAR_ARRAY = "key_piar_array";
const KEY_TO_ARRAY = "to_array";

let db = undefined;

function getDb()
{
	if(!db)
	{
		let dbDir = path.join(__dirname, "../data");
		db = levelup(leveldown(dbDir));
	}
	
	return db;
}

exports.generateKeyPiar = function(cb)
{
	let privateKey = util.createPrivateKey();
	exports.saveFrom(privateKey, cb);
}

/**
 * @param {Buffer} privateKey
 */
exports.saveFrom = function(privateKey, cb)
{
	privateKey = util.toBuffer(privateKey);

	if(util.isValidPrivate(privateKey) === false)
	{
		return cb("saveFrom invalid privateKey");
	}


	let publicKey = util.privateToPublic(privateKey);
	let address = util.publicToAddress(publicKey)

	let db = getDb();
	async.waterfall([
		function(cb) {
			db.get(KEY_KEY_PIAR_ARRAY, function(err, raw) {
				if(!!err)
				{
					if(err.notFound)
					{
			      return cb(null, []);
			    }
			    return cb(err);
				}

		    cb(null, rlp.decode(raw));
			});
		},
		function(keyPairArray, cb) {
			// check if privateKey is exist
			for(let i = 0; i < keyPairArray.length; i++)
			{
				if(privateKey.toString("hex") === util.toBuffer(keyPairArray[i][0]).toString("hex"))
				{
					return cb(null);
				}
			}

			//
			keyPairArray.push([privateKey, publicKey, address]);

			//
			db.put(KEY_KEY_PIAR_ARRAY, rlp.encode(keyPairArray), cb);
		}], function(err) {
			if(!!err)
			{
				return cb(err);
			}

			cb(null, [privateKey.toString("hex"), publicKey.toString("hex"), address.toString("hex")]);
		});
}

exports.getFromHistory = function(cb)
{
	let db = getDb();

	db.get(KEY_KEY_PIAR_ARRAY, function(err, raw) {
		if(!!err)
		{
			if(err.notFound)
			{
	      return cb(null, []);
	    }
	    return cb(err);
		}

    let keyPairArray = rlp.decode(raw);
    let addressArray = [];
    for(let i = 0; i < keyPairArray.length; i++)
    {
    	addressArray.push(keyPairArray[i][2].toString("hex"));
    }

    cb(null, addressArray);
	});
}

/**
 * @param {Buffer} to
 */
exports.saveTo = function(to, cb)
{
	to = util.toBuffer(to);

	let db = getDb();
	async.waterfall([
		function(cb) {
			db.get(KEY_TO_ARRAY, function(err, raw) {
				if(!!err)
				{
					if(err.notFound)
					{
			      return cb(null, []);
			    }
			    return cb(err);
				}

		    cb(null, rlp.decode(raw));
			});
		},
		function(toArray, cb) {
			// check if to is exists
			for(let i = 0; i < toArray.length; i++)
			{
				if(to.toString("hex") === util.toBuffer(toArray[i]).toString("hex"))
				{
					return cb(null);
				}
			}

			//
			toArray.push(to);

			//
			db.put(KEY_TO_ARRAY, rlp.encode(toArray), cb);
		}], function(err) {
			if(!!err)
			{
				return cb(err);
			}

			cb(null);
		});
}

exports.getToHistory = function(cb)
{
	let db = getDb();

	db.get(KEY_TO_ARRAY, function(err, raw) {
		if(!!err)
		{
			if(err.notFound)
			{
	      return cb(null, []);
	    }
	    return cb(err);
		}

    let toArray = rlp.decode(raw);
    let addressArray = [];
    for(let i = 0; i < toArray.length; i++)
    {
    	addressArray.push(toArray[i].toString("hex"));
    }

    cb(null, addressArray);
	});
}

/**
 * @param {Buffer} address
 */
exports.getAccountInfo = function(address, cb)
{
	address = util.toBuffer(address);

	let db = getDb();

	// get account info
	db.get(address, function(err, raw) {
		if(!!err)
		{
			if(err.notFound)
			{
	      return cb(null, new Account());
	    }
	    return cb(err);
		}

    cb(null, rlp.decode(raw));
	});
}

/**
 * @param {Object} transaction
 * @param {*} transaction.from from address
 * @param {*} transaction.to to address
 * @param {*} transaction.value value
 */
exports.sendTransaction = function(transaction, cb)
{
	let from = Buffer.from(transaction.from, "hex");
	let to = Buffer.from(transaction.to, "hex");
	let bnValue = new BN(Buffer.from(transaction.value, "hex"));

	let db = getDb();

	let privateKey;
	let tx;

	if(from.length !== 20)
	{
		return cb("sendTransaction, invalid from address");
	}

	if(to.length !== 20)
	{
		return cb("sendTransaction, invalid to address");
	}

	if(bnValue.eqn(0) || bnValue.ltn(0))
	{
		return cb("sendTransaction, invalid value");
	}

	async.waterfall([
		function(cb) {
			// get corresponding private key
			db.get(KEY_KEY_PIAR_ARRAY, function(err, raw) {
				if(!!err)
				{
					if(err.notFound)
					{
						return cb("sendTransaction, from address not exist");
			    }
			    return cb(err);
				}

		    let keyPairArray = rlp.decode(raw);
		    for(let i = 0; i < keyPairArray.length; i++)
		    {
		    	if(keyPairArray[i][2].toString("hex") === from.toString("hex"))
		    	{
		    		return cb(null, keyPairArray[i]);
		    	}
		    }

		    cb("sendTransaction, from address not exist");
			});
		},
		function(keyPair, cb) {
			privateKey = keyPair[0];
			let accountAddress = keyPair[2];

			exports.getAccountInfo(accountAddress, cb);
		},
		function(account, cb) {
			tx = new Transaction();
			tx.nonce = new BN(account.nonce).addn(1);
			tx.value = bnValue;
			tx.data = "";
			tx.to = to;
			tx.sign(privateKey);

			if(tx.validate() === false)
			{
				return cb("sendTransaction, invalid transaction");
			}

			cb();
		},
		function(cb) {
			sendTransactionToWorkNodes(tx, cb);
		}], function(err) {
			if(!!err)
			{
				return cb(err);
			}

			// save to address
			exports.saveTo(to, cb);
		});
}

function sendTransactionToWorkNodes(tx, cb)
{
	post(logger, "http://localhost:8080/sendTransaction", {tx: util.baToHexString(tx.serialize())}, function(err, data) {
		if(!!err)
		{
			return cb(err);
		}

		console.log("************* data.code: " + data.code + ", SUCCESS: " + SUCCESS)
		if(data.code !== SUCCESS)
		{
			return cb(data.msg);
		}
		
		cb(null);
	});
}