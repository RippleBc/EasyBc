const Block = require("../../../depends/block");
const RippleBlock = require("../data/rippleBlock");
const utils = require("../../../depends/utils");
const Stage = require("./stage");
const process = require("process");
const async = require("async");

const sha256 = utils.sha256;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

const PROTOCOL_CMD_BLOCK_AGREEMENT = 400;
const PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_REQUEST = 401;
const PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_RESPONSE = 402;

class BlockAgreement extends Stage
{
	constructor(ripple)
	{
		super({
			finish_state_request_cmd: PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_REQUEST,
			finish_state_response_cmd: PROTOCOL_CMD_BLOCK_AGREEMENT_FINISH_STATE_RESPONSE,
			handler: this.handler
		});

		this.ripple = ripple;
		this.rippleBlocks = [];
	}

	handler()
	{
		const blockHash = new Hash();
		this.rippleBlocks.forEach(rippleBlock => {
			const key = sha256(rippleBlock.block);

			if(blockHash.has(key))
			{
				blockHash[key].count += 1;
			}
			else
			{
				blockHash[key] = {
					count: 1,
					data: rippleBlock.block
				};
			}
		});

		const primaryBlock = [...blockHash].sort(block => {
			return -block[1].count;
		});

		if(primaryBlock[0][1] / unl.length >= 0.8)
		{
			const tmp = new Block(primaryBlock[0]);

			this.ripple.processor.run(tmp);
		}
		else
		{

			const tmp = new Candidate(primaryBlock[0]);

			this.ripple.amalgamate.reset();
			this.ripple.amalgamate.run(rlp.decode(tmp.transactions));
		}
	}

	/**
	 * @param {Buffer} transactions
	 */
 	run(transactions)
 	{
 		assert(Buffer.isArray(transactions), `BlockAgreement run, transactions should be an Buffer, now is ${typeof transactions}`);

 		// init block
		const block = new Block({
			transactions: transactions
		});

		async.waterfall([
			function(cb)
			{
				this.ripple.processor.blockChain.getBlockChainHeight().then(height => {
					block.number = (new BN(height).iaddn(1)).toString(16);

					cb(null, height);
				}).catch(e => {
					cb(e);
				});
			},

			function(height, cb)
			{
				this.ripple.processor.blockChain.getBlockHashByNumber(height).then(parentHash => {
					block.header.parentHash = parentHash;

					cb();
				}).catch(e => {
					cb(e);
				});
			}], e => {
				if(!!e)
				{
					throw new Error(`BlockAgreement run failed, ${e}`);
				}

				const rippleBlock = new RippleBlock({
					block: block.serialize()
				});
				rippleBlock.sign(privateKey);

				// broadcast block
				p2p.sendAll(PROTOCOL_CMD_BLOCK_AGREEMENT, rippleBlock.serialize());

				this.initFinishTimeout();
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

		const block = new Block(data);

		if(block.validate())
		{
			if(address.toString("hex") !== block.from.toString("hex"))
			{
				logger.error(`BlockAgreement handleBlockAgreement, address is invalid, address should be ${address.toString("hex")}, now is ${block.from.toString("hex")}`);
			}
			else
			{
				this.rippleBlocks.push(block);
			}
		}
		else
		{
			logger.error(`BlockAgreement handleBlockAgreement, address ${address.toString("hex")}, send an invalid message`);
		}

		this.recordFinishNode(block.from.toString("hex"));
	}

	reset()
	{
		super.reset();
		this.rippleBlocks = [];
	}
}

module.exports = BlockAgreement;