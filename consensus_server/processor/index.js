const process = require("process");
const child_process = require("child_process");
const Transaction = require("../../depends/transaction");
const Block = require("../../depends/block");
const BlockChain = require("../../depends/block_chain");
const utils = require("../../depends/utils");
const Consensus = require("../ripple");
const { TRANSACTION_CACHE_MAX_NUM } = require("../constant");
const assert = require("assert");
const Message = require("../../depends/fly/net/message");
const Trie = require("../../depends/trie");
const Update = require("../update");

const loggerConsensus = process[Symbol.for("loggerConsensus")];
const loggerUpdate = process[Symbol.for("loggerUpdate")];
const p2p = process[Symbol.for("p2p")];
const db = process[Symbol.for("db")];
const mysql = process[Symbol.for("mysql")];

const BN = utils.BN;
const bufferToInt = utils.bufferToInt;

var updateInstance;

const update = new Update();

class Processor
{
	constructor()
	{
		const self = this;

		this.blockChain = new BlockChain({
			trie: new Trie(db),
			db: mysql
		});

		this.consensus = new Consensus(self);

		// transactions cache
		this.transactionRawsCache = new Set();
	}

	run()
	{
		update.run().then(() => {
			loggerUpdate.info("update is success");
		});

		this.consensus.run();
	}

	/**
	 * @param {Number} size
	 */
	getTransactions(size)
	{
		assert(typeof size === "number", `Processor getTransactions, size should be a Number, now is ${typeof size}`);

		size = size > this.transactionRawsCache.size ? this.transactionRawsCache.size : size;

		return [...this.transactionRawsCache].splice(0, size);
	}

	/**
	 * @param {Buffer} address
	 * @param {Message} message
	 */
	handleMessage(address, message)
	{
		assert(Buffer.isBuffer(address), `Processor handleMessages, address should be an Buffer, now is ${typeof message}`);
		assert(message instanceof Message, `Processor handleMessages, message should be a Message Object, now is ${typeof message}`);

		const cmd = bufferToInt(message.cmd);
		const data = message.data;

		this.consensus.handleMessage(address, cmd, data);
	}

	/**
	 * @param {String} transaction
	 */
	async processTransaction(transactionRaw)
	{
		assert(typeof transactionRaw !== "string", `Processor processTransaction, transactionRaw should be a String, now is ${typeof transactionRaw}`);

		const self = this;

		const promise = new Promise((resolve, reject) => {
			if(self.transactionRawsCache.size > TRANSACTION_CACHE_MAX_NUM)
			{
				reject(`Processor processTransaction, this.transactionRawsCache length should be litter than ${TRANSACTION_CACHE_MAX_NUM}`);
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

			self.transactionRawsCache.add(transactionRaw);

			resolve();
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
			const { state, msg, failedTransactions } = await this.blockChain.runBlockChain({
				block: block, 
				generate: generate
			});

			// block chain is out of date, need update
			if(state === false && msg.indexOf("run block chain, getBlockByHash key not found") >= 0)
			{
				update.run().then(() => {
					loggerUpdate.info("update is success");
				});
				return;
			}

			// del invalid transactions
			block.delInvalidTransactions(failedTransactions);
		}
		while(state === false);

		// record
		db.recordBlock(block);
		db.recordAccount(accounts);
	}
}

module.exports = Processor;