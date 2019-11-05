const Block = require("../../../depends/block");
const Transaction = require("../../../depends/transaction");
const Prepare = require("../data/prepare");
const utils = require("../../../depends/utils");
const Stage = require("./stage");
const assert = require("assert");
const {STAGE_STATE_EMPTY, RIPPLE_STAGE_BLOCK_AGREEMENT, PROTOCOL_CMD_BLOCK_AGREEMENT, PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_REQUEST, PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_RESPONSE } = require("../../constant");
const _ = require("underscore");

const Buffer = utils.Buffer;
const BN = utils.BN;
const rlp = utils.rlp;
const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];
const unlManager = process[Symbol.for("unlManager")];

const BLOCK_AGREEMENT_TIMESTAMP_JUMP_LENGTH = 100;

class BlockAgreement extends Stage
{
	constructor(ripple)
	{
		super({
			name: 'blockAgreement',
			synchronize_state_request_cmd: PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_REQUEST,
			synchronize_state_response_cmd: PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_RESPONSE
		});

		this.ripple = ripple;
		this.rippleBlocks = [];
	}

	handler({ ifSuccess = true, ifCheckState = true } = { ifSuccess: true, ifCheckState: true })
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
			const key = rippleBlock.hash(false).toString('hex');

			if(blocksHash.has(key))
			{
				const count = blocksHash.get(key).count;

				blocksHash.set(key, {
					count: count + 1,
					data: rippleBlock
				});
			}
			else
			{
				blocksHash.set(key, {
					count: 1,
					data: rippleBlock
				});
			}
		});

		// debug candidate
		for (let [key, value] of blocksHash) {
		  logger.info(`BlockAgreement handler, candidate hash: ${key}, count: ${value.count}`);
		}

		const sortedBlocks = _.sortBy([...blocksHash], block => -block[1].count);

		const fullUnl = unlManager.fullUnl;

		if(sortedBlocks[0] && sortedBlocks[0][1].count / (fullUnl.length + 1) >= )
		{
			logger.info("BlockAgreement handler, block agreement success, begin to process block");

			this.reset();
			
			// init block
			const consensusRippleBlock = new Prepare(sortedBlocks[0][1].data);
			const consensusBlock = new Block({
				header: {
					number: consensusRippleBlock.number,
					parentHash: consensusRippleBlock.parentHash,
					timestamp: consensusRippleBlock.timestamp
				},
				transactions: consensusRippleBlock.transactions
			});

			// begin process block
			(async () => {

				await this.ripple.processor.processBlock({
					block: consensusBlock
				});

				logger.info("BlockAgreement handler, block agreement success, process block is over");

				// begin new round
				this.ripple.run({
					fetchingNewTransaction: true,
					transactions: newTransactions
				});
				
				// delete transactions from db
				await deleteTransactions()		

			})().then(() => {
				logger.trace("BlockAgreement handler, process block success, new round begin")
			}).catch(e => {
				logger.fatal(`BlockAgreement handler, throw exception, ${process[Symbol.for("getStackInfo")](e)}`);

				process.exit(1);
			});

			return;
		}

		this.reset();
		this.ripple.run();
	}

	/**
	 * @param {Buffer} transactions
	 */
 	run(transactions)
 	{
 		assert(Buffer.isBuffer(transactions), `BlockAgreement run, transactions should be an Buffer, now is ${typeof transactions}`);
		 
		if(this.state !== STAGE_STATE_EMPTY)
		{
			logger.fatal(`BlockAgreement run, block agreement state should be STAGE_STATE_EMPTY, now is ${this.state}, ${process[Symbol.for("getStackInfo")]()}`);
			
			process.exit(1)
		}

 		this.ripple.stage = RIPPLE_STAGE_BLOCK_AGREEMENT;
 		this.start();
 		
 		// init Prepare
			const rippleBlock = new Prepare({
			transactions: transactions
		});

		// init timestamp, drag timestamp to make sure it is will not too litte than current time
		let timestamp = 0;
		const transactionsArray = rlp.decode(transactions);
		for(let i = 0; i < transactionsArray.length; i++)
		{
			let transaction = new Transaction(transactionsArray[i]);

			if(bufferToInt(transaction.timestamp) > timestamp)
			{
				timestamp = bufferToInt(transaction.timestamp)
			}
		}

		// init oth property
		(async () => {
			// init number
			const height = await this.ripple.processor.blockChain.getBlockChainHeight();
			if(!height)
			{
				await Promise.reject(`BlockAgreement run, getBlockChainHeight(${height.toString("hex")}) should not return undefined`)
			}
			rippleBlock.number = (new BN(height).addn(1)).toArrayLike(Buffer);
			const parentHash = await this.ripple.processor.blockChain.getBlockHashByNumber(height);
			if(!parentHash)
			{
				await Promise.reject(`BlockAgreement run, getBlockHashByNumber(${height.toString("hex")}) should not return undefined`);
			}

			// init parentHash
			rippleBlock.parentHash = parentHash;

			// init timestamp, drag timestamp to make sure it is bigger than parent block's timestamp
			const parentBlock = await this.ripple.processor.blockChain.getBlockByHash(parentHash);
			while(timestamp <= bufferToInt(parentBlock.header.timestamp))
			{
				timestamp += BLOCK_AGREEMENT_TIMESTAMP_JUMP_LENGTH;
			}
			rippleBlock.timestamp = timestamp;

			// sign
			rippleBlock.sign(privateKey);

			// broadcast rippleBlocks
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

		const rippleBlock = new Prepare(data);

		this.validateAndProcessExchangeData(rippleBlock, this.rippleBlocks, address.toString("hex"));
	}

	reset()
	{
		super.reset();

		this.removeAllListeners("runBlockFinished");
		this.rippleBlocks = [];
	}
}

module.exports = BlockAgreement;