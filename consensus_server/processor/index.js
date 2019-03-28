const process = require("process");
const child_process = require("child_process");
const Transaction = require("../../depends/transaction");
const Block = require("../../depends/block");
const BlockChain = require("../../depends/block_chain");
const utils = require("../../depends/utils");
const FlowStoplight = require("flow-stoplight");
const Pool = require("../ripple/data/pool");
const Consensus = require("../ripple");
const { ERR_RUN_BLOCK_TX_PROCESS } = require("../../constant");
const { TRANSACTION_CACHE_MAX_NUM } = require("../constant");
const assert = require("assert");
const Message = require("../../depends/fly/net/message");

const loggerConsensus = process[Symbol.for("loggerConsensus")];
const p2p = process[Symbol.for("p2p")];

const BN = utils.BN;
const bufferToInt = utils.bufferToInt;

var updateInstance;
function update()
{
	if(!updateInstance)
	{
		loggerConsensus.info("block chain update start");
		updateInstance = child_process.fork("../update.js");

		updateInstance.on("exit", () => {
			loggerConsensus.info("block chain update finished");

			updateInstance = undefined;
		});

		updateInstance.on("error", e => {
			loggerConsensus.info(`block chain update failed, ${e}`);

			updateInstance = undefined;
		});
	}
}

class Processor
{
	constructor(opts)
	{
		const self = this;

		this.stoplight = new FlowStoplight();

		this.blockChain = new BlockChain();

		this.consensus = new Consensus(self);

		// transactions cache
		this.transactionsPool = new Pool();
	}

	run()
	{
		update();

		self.consensus.run();

		this.stoplight.go()
	}

	handleMessages(message)
	{
		assert(message instanceof Message, `Processor handleMessages, message should be a Message Object, now is ${typeof message}`);

		const cmd = bufferToInt(message.data)
		const data = message.data;

		switch(cmd)
		{
			
		}
	}

	/**
	 * @param {String} transaction
	 */
	async processTransaction(transactionRaw)
	{
		assert(typeof transactionRaw !== "string", `Processor processTransaction, transactionRaw should be a String, now is ${typeof transactionRaw}`);

		const self = this;

		const promise = new Promise((resolve, reject) => {
			self.stoplight.await(() => {
				if(self.transactionsPool.length > TRANSACTION_CACHE_MAX_NUM)
				{
					reject(`Processor processTransaction, this.transactionsPool length should be litter than ${TRANSACTION_CACHE_MAX_NUM}`);
				}

				let transaction;
				try
				{
					transaction = new Transaction(transactionRaw);

					let {state, msg} = transaction.validate();
					if(!state)
					{
						reject(`Processor processTransaction, transaction invalid failed, ${msg}`);
					}
				}
				catch(e)
				{
					reject(`Processor processTransaction, new Transaction() failed, ${e}`)
				}

				loggerConsensus.info(`Processor processTransaction, transaction ${transaction.hash().toString("hex")}: ${JSON.stringify(transaction.toJSON())}`);

				self.transactionsPool.push(transaction);

				resolve();
			});
		});

		return promise;
	}

	/**
	 * @param {Object} opts
	 * @prop {Block} block
	 * @prop {Boolean} generate
	 */
	async processBlock(opts)
	{
		const block = opts.block;
		const generate = opts.generate || true;

		assert(block instanceof Block, `Processor processBlock, block should be an Block Object, now is ${typeof block}`);

		if(block.transactions.length === 0)
		{
			loggerConsensus.info(`Processor processBlock, block ${block.hash().toString("hex")} has no transaction`);
			return;
		}

		do
		{
			const { state, msg, failedTransactions } = await this.blockChain.runBlockChain({block: block, generate: generate});

			// block chain is out of date, need update
			if(state === false && msg.indexOf("run block chain, getBlockByHash failed") >= 0)
			{
				update();
				return;
			}

			// del invalid transactions
			block.delInvalidTransactions(failedTransactions);
		}
		while(state === false);
}

module.exports = Processor;