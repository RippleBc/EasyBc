const Block = require("../../../depends/block");
const RippleBlock = require("../data/rippleBlock");
const utils = require("../../../depends/utils");
const Stage = require("./stage");
const async = require("async");
const assert = require("assert");
const { unl } = require("../../config.json");
const { BLOCK_AGREEMENT_TIMESTAMP_JUMP_LENGTH, BLOCK_AGREEMENT_TIMESTAMP_MAX_OFFSET, TRANSACTIONS_CONSENSUS_THRESHOULD, RIPPLE_STAGE_BLOCK_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK, PROTOCOL_CMD_BLOCK_AGREEMENT, PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_REQUEST, PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_RESPONSE } = require("../../constant");
const _ = require("underscore");

const sha256 = utils.sha256;
const Buffer = utils.Buffer;
const BN = utils.BN;
const rlp = utils.rlp;
const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class BlockAgreement extends Stage
{
	constructor(ripple)
	{
		super({
			synchronize_state_request_cmd: PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_REQUEST,
			synchronize_state_response_cmd: PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_RESPONSE
		});

		this.ripple = ripple;
		this.rippleBlocks = [];
	}

	handler(ifSuccess)
	{
		if(ifSuccess)
		{
			logger.info("BlockAgreement handler success")
		}
		else
		{
			logger.info("BlockAgreement handler success because of timeout")
		}
		
		const blocksHash = new Map();
		this.rippleBlocks.forEach(rippleBlock => {
			const key = sha256(rippleBlock.block).toString('hex');

			if(blocksHash.has(key))
			{
				const count = blocksHash.get(key).count;

				blocksHash.set(key, {
					count: count + 1,
					data: rippleBlock.block
				});
			}
			else
			{
				blocksHash.set(key, {
					count: 1,
					data: rippleBlock.block
				});
			}
		});

		// debug candidate
		for (let [key, value] of blocksHash) {
		  logger.trace(`BlockAgreement handler, candidate hash: ${key}, count: ${value.count}`);
		}

		const sortedBlocks = _.sortBy([...blocksHash], block => -block[1].count);

		if(sortedBlocks[0] && sortedBlocks[0][1].count / (unl.length + 1) >= TRANSACTIONS_CONSENSUS_THRESHOULD)
		{
			logger.info("BlockAgreement handler, block agreement success, begin to process block");

			this.ripple.stage = RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK;

			this.reset();
			
			(async () => {
				await this.ripple.processor.processBlock({
					block: new Block(sortedBlocks[0][1].data)
				});

				logger.info("BlockAgreement handler, block agreement success, process block is over");

				await this.ripple.run(false);

				for(let i = 0; i < this.ripple.amalgamateMessagesCache.length; i++)
				{
					let {address, cmd, data} = this.ripple.amalgamateMessagesCache[i];
					this.ripple.amalgamate.handleMessage(address, cmd, data);
				}

				this.ripple.amalgamateMessagesCache = [];		

			})().then(() => {
				logger.trace("BlockAgreement handler, process block success, new round begin")
			}).catch(e => {
				logger.fatal(`BlockAgreement handler, throw exception, ${process[Symbol.for("getStackInfo")](e)}`);

				process.exit(1);
			});

			return;
		}

		this.reset();
		this.ripple.run(true)
	}

	/**
	 * @param {Buffer} transactions
	 */
 	run(transactions)
 	{
 		assert(Buffer.isBuffer(transactions), `BlockAgreement run, transactions should be an Buffer, now is ${typeof transactions}`);
 		
 		this.ripple.stage = RIPPLE_STAGE_BLOCK_AGREEMENT;
 		this.start();
 		
 		// init block trasactions
		const block = new Block({
			transactions: transactions
		});

		// init timestamp, drag timestamp to make sure it is will not too litte than current time
		console.time("first init timestamp");
		let timestamp = 0;
		for(let i = 0; i < block.transactions.length; i++)
		{
			let transaction = block.transactions[i];

			if(bufferToInt(transaction.timestamp) > timestamp)
			{
				timestamp = bufferToInt(transaction.timestamp)
			}

			logger.trace(`BlockAgreement run, transaction hash: ${transaction.hash().toString("hex")}, from: ${transaction.from.toString("hex")}, to: ${transaction.to.toString("hex")}, value: ${transaction.value.toString("hex")}, nonce: ${transaction.nonce.toString("hex")}`);
		}
		const now = Date.now();
		while(now - timestamp > BLOCK_AGREEMENT_TIMESTAMP_MAX_OFFSET)
		{
			timestamp += BLOCK_AGREEMENT_TIMESTAMP_MAX_OFFSET
		}
		console.log(`first timestamp: ${timestamp}`)
		console.timeEnd("first init timestamp");

		// init oth property
		(async () => {
			// init number
			const height = await this.ripple.processor.blockChain.getBlockChainHeight();
			if(!height)
			{
				await Promise.reject(`BlockAgreement run, getBlockChainHeight(${height.toString("hex")}) should not return undefined`)
			}
			block.header.number = (new BN(height).addn(1)).toArrayLike(Buffer);
			const parentHash = await this.ripple.processor.blockChain.getBlockHashByNumber(height);
			if(!parentHash)
			{
				await Promise.reject(`BlockAgreement run, getBlockHashByNumber(${height.toString("hex")}) should not return undefined`);
			}

			// init parentHash
			block.header.parentHash = parentHash;

			// init txTrie
			block.header.transactionsTrie = await block.genTxTrie();

			// init itemstamp, drag timestamp to make sure it is bigger than parent block's timestamp
			console.time("second init timestamp");
			const parentBlock = await this.ripple.processor.blockChain.getBlockByHash(parentHash);
			while(timestamp <= bufferToInt(parentBlock.header.timestamp))
			{
				timestamp += BLOCK_AGREEMENT_TIMESTAMP_JUMP_LENGTH;
			}
			block.header.timestamp = timestamp;
			console.log(`second timestamp: ${timestamp}`)
			console.timeEnd("second init timestamp");

			// sign
			const rippleBlock = new RippleBlock({
				block: block.serialize()
			});
			rippleBlock.sign(privateKey);

			// broadcast block
			p2p.sendAll(PROTOCOL_CMD_BLOCK_AGREEMENT, rippleBlock.serialize());

			//
			this.rippleBlocks.push(rippleBlock);
		})().then(() => {
			logger.trace('BlockAgreement run, success')
		}).catch(e => {
			logger.fatal(`BlockAgreement run, throw exception, ${process[Symbol.for("getStackInfo")](e)}`);
			
			process.exit(1);
		}).finally(() => {
			this.emit("runBlockFinished");
		});
 	}

 	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage(address, cmd, data)
	{
		assert(Buffer.isBuffer(address), `BlockAgreement handleMessage, address should be an Buffer, now is ${typeof address}`);
		assert(typeof cmd === "number", `BlockAgreement handleMessage, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(data), `BlockAgreement handleMessage, data should be an Buffer, now is ${typeof data}`);

		switch(cmd)
		{
			case PROTOCOL_CMD_BLOCK_AGREEMENT:
			{
				this.handleBlockAgreement(address, data);
			}
			break;
			default:
			{
				super.handleMessage(address, cmd, data);
			}
		}
	}

	/**
	 * @param {Buffer} data
	 */
	handleBlockAgreement(address, data)
	{
		assert(Buffer.isBuffer(address), `BlockAgreement handleBlockAgreement, address should be an Buffer, now is ${typeof address}`);
		assert(Buffer.isBuffer(data), `BlockAgreement handleBlockAgreement, data should be an Buffer, now is ${typeof data}`);

		const rippleBlock = new RippleBlock(data);

		if(rippleBlock.validate())
		{
			if(address.toString("hex") !== rippleBlock.from.toString("hex"))
			{
				this.cheatedNodes.push(address.toString('hex'));

				logger.info(`BlockAgreement handleBlockAgreement, address should be ${address.toString("hex")}, now is ${rippleBlock.from.toString("hex")}`);
			}
			else
			{
				if(this.checkIfNodeFinishDataExchange(address.toString("hex")))
				{
					logger.info(`BlockAgreement handleBlockAgreement, address: ${address.toString("hex")}, send the same exchange data`);
				
					this.cheatedNodes.push(address.toString('hex'));
				}
				else
				{
					this.rippleBlocks.push(rippleBlock);
				}
			}
		}
		else
		{
			this.cheatedNodes.push(address.toString('hex'));
			
			logger.info(`BlockAgreement handleBlockAgreement, address ${address.toString("hex")}, validate failed`);
		}

		this.recordDataExchangeFinishNode(address.toString("hex"));
	}

	reset()
	{
		super.reset();

		this.removeAllListeners("runBlockFinished");
		this.rippleBlocks = [];
	}

	checkIfIsProcessingBlock()
	{
		return this.ripple.stage === RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK;
	}
}

module.exports = BlockAgreement;