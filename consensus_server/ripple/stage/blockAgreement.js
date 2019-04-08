const Block = require("../../../depends/block");
const RippleBlock = require("../data/rippleBlock");
const utils = require("../../../depends/utils");
const Stage = require("./stage");
const process = require("process");
const async = require("async");
const assert = require("assert");

const sha256 = utils.sha256;
const Buffer = utils.Buffer;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

const PROTOCOL_CMD_BLOCK_AGREEMENT = 400;
const PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_REQUEST = 401;
const PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_RESPONSE = 402;

const THRESHOULD = 0.8;

class BlockAgreement extends Stage
{
	constructor(ripple)
	{
		super({
			finish_state_request_cmd: PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_REQUEST,
			finish_state_response_cmd: PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_RESPONSE
		});

		this.ripple = ripple;
		this.rippleBlocks = [];
	}

	handler()
	{
		const blocksHash = new Map();
		this.rippleBlocks.forEach(rippleBlock => {
			const key = sha256(rippleBlock.block);

			if(blocksHash.has(key))
			{
				blocksHash[key].count += 1;
			}
			else
			{
				blocksHash[key] = {
					count: 1,
					data: rippleBlock.block
				};
			}
		});

		const sortedBlocks = [...blocksHash].sort(block => {
			return -block[1].count;
		});

		if(sortedBlocks[0] && sortedBlocks[0][1] / unl.length >= THRESHOULD)
		{
			this.ripple.processor.processBlock({
				block: new Block(sortedBlocks[0][1].data)
			}).then(() => {
				this.ripple.run();
			}).catch(e => {
				throw new Error(`BlockAgreement handle, processBlock failed, ${e}`);
			});

			return;
		}

		this.ripple.run();
	}

	/**
	 * @param {Buffer} transactions
	 */
 	run(transactions)
 	{
 		assert(Buffer.isBuffer(transactions), `BlockAgreement run, transactions should be an Buffer, now is ${typeof transactions}`);

 		this.init();
 		
 		// init block
		const block = new Block({
			transactions: transactions
		});

		const self = this;
		const run  = async function()
		{
			const height = await self.ripple.processor.blockChain.getBlockChainHeight();

			if(!height)
			{
				throw new Error(`BlockAgreement run, getBlockChainHeight(${height.toString("hex")}) should not return undefined`)
			}
			
			block.header.number = (new BN(height).addn(1)).toArrayLike(Buffer);
			const parentHash = await self.ripple.processor.blockChain.getBlockHashByNumber(height);
			if(!parentHash)
			{
				throw new Error(`BlockAgreement run, getBlockHashByNumber(${height.toString("hex")}) should not return undefined`);
			}

			block.header.parentHash = parentHash;

			const rippleBlock = new RippleBlock({
				block: block.serialize()
			});
			rippleBlock.sign(privateKey);

			// broadcast block
			p2p.sendAll(PROTOCOL_CMD_BLOCK_AGREEMENT, rippleBlock.serialize());
		} 
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
				this.handleBlockAgreement(data);
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
				logger.error(`BlockAgreement handleBlockAgreement, address is invalid, address should be ${address.toString("hex")}, now is ${rippleBlock.from.toString("hex")}`);
			}
			else
			{
				this.rippleBlocks.push(rippleBlock);
			}
		}
		else
		{
			logger.error(`BlockAgreement handleBlockAgreement, address ${address.toString("hex")}, send an invalid message`);
		}

		this.recordFinishNode(address.toString("hex"));
	}

	reset()
	{
		super.innerReset();
		this.rippleBlocks = [];
	}
}

module.exports = BlockAgreement;