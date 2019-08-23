const process = require('process');
const Mysql = require("./mysql");
const { getBlockNumber, saveBlockNumber } = require('./db');
const log4js= require("./logConfig");
const assert = require("assert");
const mongoConfig = require("./config").mongo;
const utils = require("../depends/utils");
const Trie = require("../depends/merkle_patricia_tree");

const BN = utils.BN;

const logger = log4js.getLogger();

const mysql = new Mysql();

//
process.on("uncaughtException", function(err) {
    logger.fatal(`transactions parser, throw exception, ${err.stack}`);
    
    process.exit(1);
});

(async () => {
	// init mysql
	await mysql.init();
	process[Symbol.for("mysql")] = mysql;

	// init mongo
  const mongo = require("../depends/mpt_db_wrapper");
  await mongo.initBaseDb(mongoConfig.host, mongoConfig.port, mongoConfig.user, mongoConfig.password, mongoConfig.dbName);

	// init accountTrie
	const accountDb = mongo.generateMptDb()
	process[Symbol.for("accountTrie")] = new Trie(accountDb);

	// init receiptTrie
	const receiptDb = mongo.generateReceiptMptDb()
	process[Symbol.for("receiptTrie")] = new Trie(receiptDb);

	// init blockDb
	const blockDb = process[Symbol.for("blockDb")] = mongo.generateBlockDb();

	await run(blockDb);
})()

/**
 * @param {BlockDb} blockDb
 */
const run = async blockDb =>
{
	const broadCastSpv = require("./constracts/broadCastSpv");
	const parseReceipt = require("./constracts/parseReceipt");
	
	let blockNumber;

	// get block number which is need to be process
	blockNumber = await getBlockNumber();

	if(!blockNumber)
	{
		blockNumber = Buffer.alloc(1)
	}

	while(true)
	{
		// fetch block
		const block = await blockDb.getBlockByNumber(blockNumber);

		if(block)
		{
			// save transactions
			const transactions = block.transactions;
			await mysql.saveTransactions(blockNumber, transactions);

			// parse spv
			await parseReceipt(block);

			//
			await broadCastSpv(blockNumber, transactions);

			// update block number
			blockNumber = new BN(blockNumber).addn(1).toBuffer();
			await saveBlockNumber(blockNumber)
		}
		else
		{
			await new Promise((resolve, reject) => {
				setTimeout(() => {
					resolve()
				}, 1000);
			})
		}
	}
}

console.log("process.pid: " + process.pid)