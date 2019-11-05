const Candidate = require("../data/candidate");
const utils = require("../../../depends/utils");
const assert = require("assert");
const { RIPPLE_STAGE_AMALGAMATE, PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ, PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_REQUEST, PROTOCOL_CMD_CANDIDATE_AMALGAMATE_FINISH_STATE_RESPONSE } = require("../../constant");

const rlp = utils.rlp;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class Amalgamate
{
	constructor(ripple)
	{
		super({ name: 'amalgamate' });

		this.ripple = ripple;
	}

	run()
	{
		this.ripple.stage = RIPPLE_STAGE_AMALGAMATE;
	}

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage(address, cmd, data)
	{
		assert(Buffer.isBuffer(address), `Amalgamate handleMessage, address should be an Buffer, now is ${typeof address}`);
		assert(typeof cmd === "number", `Amalgamate handleMessage, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(data), `Amalgamate handleMessage, data should be an Buffer, now is ${typeof data}`);

		switch(cmd)
		{
			case PROTOCOL_CMD_TRANSACTION_AMALGAMATE_REQ:
			{
				
				this.processingTransactions
					
			}
			break;
		
		}
	}

	reset()
	{
		
	}
}

module.exports = Amalgamate;