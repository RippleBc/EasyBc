const process = require('process');
const Mysql = require("./mysql");
const { getBlockNumber, saveBlockNumber } = require('./db');
const log4js= require("./logConfig");
const assert = require("assert");
const mongoConfig = require("./config").mongo;

const logger = log4js.getLogger("logParse");

const mysql = new Mysql();

//
process.on("uncaughtException", function(err) {
    logger.fatal(`log parser, throw exception, ${err.stack}`);
    
    process.exit(1);
});

(async () => {
	// init mysql
	await mysql.init();

	// init mongo
  const mongo = require("../depends/mpt_db_wrapper");
  await mongo.initBaseDb(mongoConfig.host, mongoConfig.port, mongoConfig.user, mongoConfig.password);

	await run(mongo.generateBlockDb())
})().catch(e => {
	logger.fatal(`log parser throw exception, ${e.stack ? e.statck : e.toString("hex")}`);
	process.exit(1);
})

/**
 * @param {BlockDb} blockDb
 */
async run(blockDb)
{
	let blockNumber;

	while(true)
	{
		// get block number which is need to be process
		blockNumber = await getBlockNumber();
		if(!blockNumber)
		{
			blockNumber = Buffer.alloc(0)
		}

		// fetch block
		const block = await blockDb.getBlockByNumber(blockNumber);

		if(block)
		{
			// save transactions
			const transactions = block.transactions;
			await mysql.saveTransactions(blockNumber, transactions);

			// update block number
			const newBlockNumber = new BN(blockNumber).addn(1).toBuffer();
			await saveBlockNumber(newBlockNumber)
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