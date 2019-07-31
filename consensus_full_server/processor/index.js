const Block = require("../../depends/block");
const BlockChain = require("../../depends/block_chain");
const utils = require("../../depends/utils");
const Consensus = require("../ripple");
const assert = require("assert");
const Message = require("../../depends/fly/net/message");
const Update = require("./update");

const loggerConsensus = process[Symbol.for("loggerConsensus")];
const loggerUpdate = process[Symbol.for("loggerUpdate")];
const mongo = process[Symbol.for("mongo")];

const bufferToInt = utils.bufferToInt;
const Buffer = utils.Buffer;

const update = new Update();

let ifProcessingBlock = false;

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
		}).catch(e => {
			loggerUpdate.fatal(`update throw exception, ${process[Symbol.for("getStackInfo")](e)}`);

			process.exit(1)
		});

		(async () => {
			// fetch new transactions
			const { 
				transactions: newTransactions,
				deleteTransactions
			} = await this.consensus.getNewTransactions();

			this.consensus.run({
				fetchingNewTransaction: true,
				transactions: newTransactions
			});

			// delete transactions from db
			await deleteTransactions();
		})().catch(e => {
			loggerConsensus.fatal(`Processor run, getNewTransactions throw exception, ${process[Symbol.for("getStackInfo")](e)}`)

			process.exit(1);
		})
		
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
		if (ifProcessingBlock)
		{
			await Promise.reject("Processor processBlock, process block is exceeding, do not support processs multi blocks at the same time");
		}

		ifProcessingBlock = true;

		const block = opts.block;
		const generate = opts.generate || true;

		assert(block instanceof Block, `Processor processBlock, block should be an Block Object, now is ${typeof block}`);

		do
		{
			if(block.transactions.length === 0)
			{
				loggerConsensus.warn(`Processor processBlock, block ${block.hash().toString("hex")} has no transaction`);
				
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
				loggerConsensus.error(`Processor processBlock, throw exception, ${msg}`)

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

		ifProcessingBlock = false;
	}
}

module.exports = Processor;