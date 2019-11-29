const Block = require("../../depends/block");
const BlockChain = require("../../depends/block_chain");
const utils = require("../../depends/utils");
const Consensus = require("../ripple");
const assert = require("assert");
const Message = require("../../depends/fly/net/message");
const { RUN_BLOCK_CHAIN_SUCCESS,
	RUN_BLOCK_CHAIN_SOME_TRANSACTIONS_INVALID,
	RUN_BLOCK_CHAIN_PARENT_BLOCK_NOT_EXIST,
	RUN_BLOCK_CHAIN_VALIDATE_FAILED } = require("../../depends/block_chain/constants");
const { PROCESS_BLOCK_SUCCESS,
	PROCESS_BLOCK_NO_TRANSACTIONS,
	PROCESS_BLOCK_PARENT_BLOCK_NOT_EXIST,
	PROTOCOL_HEART_BEAT } = require("../constants");

const loggerConsensus = process[Symbol.for("loggerConsensus")];
const mongo = process[Symbol.for("mongo")];

const bufferToInt = utils.bufferToInt;
const Buffer = utils.Buffer;

let ifProcessingBlock = false;

class Processor
{
	constructor()
	{
		const self = this;

		this.blockChain = new BlockChain({
			receiptMptDb: mongo.generateReceiptMptDb(),
			mptDb: mongo.generateMptDb(),
			blockDb: mongo.generateBlockDb()
		});

		// 
		this.consensus = new Consensus(self);
	}

	close()
	{
		this.consensus.close();
	}

	run()
	{
		this.consensus.run().then(() => {
			loggerConsensus.info("Processor run, success");
		}).catch(e => {
			loggerConsensus.fatal(`Processor run, throw exception, ${process[Symbol.for("getStackInfo")](e)}`);

			process[Symbol.for("gentlyExitProcess")]()
		});
	}

	/**
	 * @param {Buffer} address
	 * @param {Message} message
	 */
	handleMessage(address, message)
	{
		assert(Buffer.isBuffer(address), `Processor handleMessage, address should be an Buffer, now is ${typeof message}`);
		assert(message instanceof Message, `Processor handleMessage, message should be a Message Object, now is ${typeof message}`);

		const cmd = bufferToInt(message.cmd);
		const data = message.data;

		// 
		if (PROTOCOL_HEART_BEAT === cmd)
		{
			return;
		}

		// 
		this.consensus.handleMessage({ address, cmd, data });
	}

	/**
	 * @param {Object} opts
	 * @prop {Block} block
	 * @prop {Boolean} generate
	 * @return {Number} 
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
				loggerConsensus.warn(`Processor processBlock, block ${block.hash().toString("hex")} has no valid transaction`);
				
				ifProcessingBlock = false;

				return PROCESS_BLOCK_NO_TRANSACTIONS;
			}

			const { state, msg, transactions } = await this.blockChain.runBlockChain({
				block: block, 
				generate: generate
			});

			if (state === RUN_BLOCK_CHAIN_SUCCESS)
			{
				loggerConsensus.info(`Processor processBlock, block ${block.hash().toString("hex")} success`);

				ifProcessingBlock = false;

				return PROCESS_BLOCK_SUCCESS;
			}
			else if (state === RUN_BLOCK_CHAIN_SOME_TRANSACTIONS_INVALID)
			{
				loggerConsensus.error(`Processor processBlock, throw exception, ${msg}`);

				// del invalid transactions
				block.delInvalidTransactions(transactions);
			}
			else if (state === RUN_BLOCK_CHAIN_PARENT_BLOCK_NOT_EXIST)
			{
				loggerConsensus.error(`Processor processBlock, parent block is not exist, ${msg}`);
				
				ifProcessingBlock = false;

				return PROCESS_BLOCK_PARENT_BLOCK_NOT_EXIST;
			}
			else if (state === RUN_BLOCK_CHAIN_VALIDATE_FAILED)
			{
				loggerConsensus.fatal(`Processor processBlock, block is invalid, ${msg}, ${process[Symbol.for("getStackInfo")]()}`);
				process[Symbol.for("gentlyExitProcess")]();
			}
			else
			{
				loggerConsensus.fatal(`Processor processBlock, invalid return state, ${state}, ${process[Symbol.for("getStackInfo")]()}`);
				process[Symbol.for("gentlyExitProcess")]();
			}
		}
		while(true);
	}
}

module.exports = Processor;