const child_process = require("child_process");
const Transaction = require("../../depends/transaction");
const Block = require("../../depends/block");
const BlockChain = require("../../depends/block_chain");
const utils = require("../../depends/utils");
const Consensus = require("../ripple");
const assert = require("assert");
const Message = require("../../depends/fly/net/message");
const Trie = require("../../depends/trie");
const Update = require("./update");

const loggerConsensus = process[Symbol.for("loggerConsensus")];
const loggerUpdate = process[Symbol.for("loggerUpdate")];
const p2p = process[Symbol.for("p2p")];
const mongo = process[Symbol.for("mongo")];
const mysql = process[Symbol.for("mysql")];

const BN = utils.BN;
const bufferToInt = utils.bufferToInt;
const Buffer = utils.Buffer;

var updateInstance;

const update = new Update();

class Processor
{
	constructor()
	{
		const self = this;

		this.blockChain = new BlockChain({
			mptDb: mongo.generateMptDb(),
			blockDb: mongo.generateBlockDb()
		});

		this.consensus = new Consensus(self);
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
	async getTransactions(size)
	{
		assert(typeof size === "number", `Processor getTransactions, size should be a Number, now is ${typeof size}`);

		return await mysql.getRawTransactions(size);
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
	 * @param {Object} opts
	 * @prop {Block} block
	 * @prop {Boolean} generate
	 */
	async processBlock(opts)
	{
		const block = opts.block;
		const generate = opts.generate || true;

		assert(block instanceof Block, `Processor processBlock, block should be an Block Object, now is ${typeof block}`);

		do
		{
			if(block.transactions.length === 0)
			{
				loggerConsensus.info(`Processor processBlock, block ${block.hash().toString("hex")} has no transaction`);
				break;
			}

			const { state, msg, transactions } = await this.blockChain.runBlockChain({
				block: block, 
				generate: generate
			});

			if(state === 0)
			{
				break;
			}
			else if(state === 1)
			{
				for(let i = 0; i < transactions.length; i++)
				{
					const transaction = transactions[i];
					loggerConsensus.error(`Processor processBlock, some transactions are invalid: hash: ${transaction.hash().toString("hex")}, from: ${transaction.from.toString("hex")}, to: ${transaction.to.toString("hex")}, value: ${transaction.value.toString("hex")}, nonce: ${transaction.nonce.toString("hex")}`);
				}

				// del invalid transactions
				block.delInvalidTransactions(transactions);
			}
			else if(state === 2)
			{
				update.run().then(() => {
					loggerUpdate.info("update is success");
				});
				break;
			}
			else if(state === 3)
			{
				loggerConsensus.fatal(`Processor processBlock, block is invalid, ${msg}, ${process[Symbol.for("getStackInfo")]()}`);
				process.exit(1);
			}
			else
			{
				loggerConsensus.fatal(`Processor processBlock, invalid return state, ${state}, ${process[Symbol.for("getStackInfo")]()}`);
				process.exit(1);
			}
		}
		while(true);
	}
}

module.exports = Processor;