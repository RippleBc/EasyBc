const PerishData = require("./data/perish");
const { unl } = require("../config.json");
const utils = require("../../depends/utils");
const process = require("process");
const {  } = require("../constant");

const rlp = utils.rlp;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class Perish
{
	constructor(ripple)
	{
		this.ripple = ripple;
	}

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage(address, cmd, data)
	{
		switch(cmd)
		{
		}
	}
}

module.exports = Perish;