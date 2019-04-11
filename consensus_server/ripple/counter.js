const CounterData = require("./data/counter");
const { unl } = require("../config.json");
const utils = require("../../depends");
const process = require("process");

const rlp = utils.rlp;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

const PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE = 300;
const PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE = 301;
const PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE = 302;
const PROTOCOL_CMD_ACOUNTER_REQUEST = 303;
const PROTOCOL_CMD_ACOUNTER_RESPONSE = 304;

const COUNTER_TIME_DETAY = 2000;

class Counter
{
	constructor(ripple)
	{
		this.ripple = ripple;
		this.counters = [];
		this.stageValidTimes = 0;
		
		// should store in database
		this.threshould = 0.5;
	}

	handler()
	{
		const countersMap = new Set();

		this.counters.forEach(counter => {
			const key = rlp([counter.round, counter.stage]).toString("hex");

			if(countersMap.hash(key))
			{
				const count = rlpcountersMap.get(key).count;

				countersMap.set(key, {
					count: count + 1,
					round: counter.round,
					stage: counter.stage
				});
			}
			else
			{
				countersMap.set(key, {
					count: 1,
					round: counter.round,
					stage: counter.stage
				});
			}
		});

		const sortedCounters = [...countersMap].sort(counter => {
			return -counter[1].count;
		});

		if(sortedCounters[0])
		{
			const round = sortedCounters[0][1].round;
			const stage = sortedCounters[0][1].stage;

			this.ripple.handleCounter(round, stage);
		}
		else
		{
			this.ripple.handleCounter(0, 0);
		}
	}

	run()
	{
		p2p.sensAll(PROTOCOL_CMD_ACOUNTER_REQUEST);

		this.timeout = setTimeout(this.handler, COUNTER_TIME_DETAY);
	}

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handlerMessage(address, cmd, data)
	{
		switch(cmd)
		{
			case PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE:
			{
				logger.error("amalgamate stage is invalid, waiting for amalgamate stage");

				this.stageValidTimes += 1;

				if(this.stageValidTimes >= this.threshould * unl.length)
				{
					this.stageValidTimes = 0;

					this.ripple.reset();

					p2p.sendAll(PROTOCOL_CMD_ACOUNTER_REQUEST);
				}
			}
			break;
			case PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE:
			{
				logger.error("candidate agreement stage is invalid, jump to amalgamate stage");

				this.stageValidTimes += 1;

				if(this.stageValidTimes >= this.threshould * unl.length)
				{
					this.stageValidTimes = 0;

					this.ripple.reset();

					p2p.sendAll(PROTOCOL_CMD_ACOUNTER_REQUEST);
				}
			}
			break;
			case PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE:
			{
				logger.error("block agreement stage is invalid, jump to amalgamate stage");

				this.stageValidTimes += 1;

				if(this.stageValidTimes >= this.threshould * unl.length)
				{
					this.stageValidTimes = 0;

					this.ripple.reset();

					p2p.sendAll(PROTOCOL_CMD_ACOUNTER_REQUEST);
				}
			}
			break;
			case PROTOCOL_CMD_ACOUNTER_REQUEST:
			{
				const counterData = new CounterData();

				counterData.round = this.ripple.round;
				counterData.stage = this.ripple.stage;

				counterData.sign(privateKey);

				p2p.send(address, PROTOCOL_CMD_ACOUNTER_RESPONSE, counterData.serialize())
			}
			break;
			case PROTOCOL_CMD_ACOUNTER_RESPONSE:
			{
				const counterData = new CounterData(data);

				if(counterData.validate())
				{
					if(address.toString("hex") !== counterData.from.toString("hex"))
					{
						logger.error(`Counter handlerMessage, address is invalid, address should be ${address.toString("hex")}, now is ${counterData.from.toString("hex")}`);
					}
					else
					{
						this.counters.push(counterData);
					}
				}
				else
				{
					logger.error(`Counter handlerMessage, address ${address.toString("hex")}, send an invalid message`);
				}

				if(counterData.length === unl.length)
				{
					clearTimeout(this.timeout);

					this.handler();
				}
			}
			break;
		}
	}
}