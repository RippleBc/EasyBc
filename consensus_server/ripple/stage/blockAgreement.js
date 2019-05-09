const Block = require("../../../depends/block");
const RippleBlock = require("../data/rippleBlock");
const utils = require("../../../depends/utils");
const Stage = require("./stage");
const process = require("process");
const async = require("async");
const assert = require("assert");
const { unl } = require("../../config.json");
const { TRANSACTIONS_CONSENSUS_THRESHOULD, RIPPLE_STAGE_BLOCK_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK, PROTOCOL_CMD_BLOCK_AGREEMENT, PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_REQUEST, PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_RESPONSE } = require("../../constant");

const sha256 = utils.sha256;
const Buffer = utils.Buffer;
const BN = utils.BN;
const rlp = utils.rlp;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

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
			const key = sha256(rippleBlock.block).toString('hex');

			if(blocksHash.has(key))
			{
				const count = blocksHash.get(key).count;

				blocksHash.set(key, {
					count: count + 1,
					data: rippleBlock.block
				})
			}
			else
			{
				blocksHash.set(key, {
					count: 1,
					data: rippleBlock.block
				});
			}
		});

		const sortedBlocks = [...blocksHash].sort(block => {
			return -block[1].count;
		});

		if(sortedBlocks[0] && sortedBlocks[0][1].count / (unl.length + 1) >= TRANSACTIONS_CONSENSUS_THRESHOULD)
		{
			logger.warn("block agreement success");

			const self = this;

			this.ripple.state = RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK;

			this.ripple.processor.processBlock({
				block: new Block(sortedBlocks[0][1].data)
			}).then(() => {

				self.ripple.run();

				self.ripple.emit("blockProcessOver");

				logger.warn("run block chain success, go to next stage");			
			});

			return;
		}

		this.ripple.run();
		this.ripple.handleCheatedNodes(this.cheatedNodes);
	}

	/**
	 * @param {Buffer} transactions
	 */
 	run(transactions)
 	{
 		assert(Buffer.isBuffer(transactions), `BlockAgreement run, transactions should be an Buffer, now is ${typeof transactions}`);

 		this.ripple.stage = RIPPLE_STAGE_BLOCK_AGREEMENT;
		this.init();

 		// init block
		const block = new Block({
			transactions: transactions
		});

		logger.warn("Block agreement begin, transactions: ");
		for(let i = 0; i < block.transactions.length; i++)
		{
			let transaction = block.transactions[i];
			logger.warn(`hash: ${transaction.hash().toString("hex")}, from: ${transaction.from.toString("hex")}, to: ${transaction.to.toString("hex")}, value: ${transaction.value.toString("hex")}, nonce: ${transaction.nonce.toString("hex")}`);
		}

		const self = this;
		(async function() {
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

			//
			self.rippleBlocks.push(rippleBlock);
		})();
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
				this.cheatedNodes.push(address);

				logger.error(`BlockAgreement handleBlockAgreement, address is invalid, address should be ${address.toString("hex")}, now is ${rippleBlock.from.toString("hex")}`);
			}
			else
			{
				this.rippleBlocks.push(rippleBlock);
			}
		}
		else
		{
			this.cheatedNodes.push(address);
			
			logger.error(`BlockAgreement handleBlockAgreement, address ${address.toString("hex")}, send an invalid message`);
		}

		this.recordFinishNode(address.toString("hex"));
	}

	reset()
	{
		super.innerReset();
		this.rippleBlocks = [];
	}

	checkProcessBlockState()
	{
		return this.ripple.state === RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK;
	}
}

module.exports = BlockAgreement;