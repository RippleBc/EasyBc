const CounterData = require("./data/counter");
const { unl } = require("../config.json");
const utils = require("../../depends/utils");
const process = require("process");
const { COUNTER_HANDLER_TIME_DETAY, COUNTER_INVALID_STAGE_TIME_SECTION, COUNTER_STATE_IDLE, COUNTER_STATE_PROCESSING, RIPPLE_STAGE_AMALGAMATE, RIPPLE_STAGE_CANDIDATE_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE, PROTOCOL_CMD_ACOUNTER_REQUEST, PROTOCOL_CMD_ACOUNTER_RESPONSE } = require("../constant");

const rlp = utils.rlp;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class Counter
{
	constructor(ripple)
	{
		this.state = COUNTER_STATE_IDLE;

		this.ripple = ripple;

		this.counters = [];

		this.stageValidStatistics = [];

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
					stage: counter.stage,
					primaryConsensusTime: counter.primaryConsensusTime,
					finishConsensusTime: counter.finishConsensusTime,
					pastTime: counter.pastTime
				});
			}
			else
			{
				countersMap.set(key, {
					count: 1,
					round: counter.round,
					stage: counter.stage,
					primaryConsensusTime: counter.primaryConsensusTime,
					finishConsensusTime: counter.finishConsensusTime,
					pastTime: counter.pastTime
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
			const primaryConsensusTime = sortedCounters[0][1].primaryConsensusTime;
			const finishConsensusTime = sortedCounters[0][1].finishConsensusTime;
			const pastTime = sortedCounters[0][1].pastTime;

			this.ripple.handleCounter(round, stage, primaryConsensusTime, finishConsensusTime, pastTime);
		}
		else
		{
			this.ripple.handleCounter(0, 0, 0, 0, 0);
		}

		// reset
		this.stageValidStatistics = [];
		this.state = COUNTER_STATE_IDLE;
		clearTimeout(this.timeout);
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
			case PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE:
			case PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE:
			case PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE:
			{
				logger.error("stage is invalid");

				const now = Date.now();

				this.stageValidStatistics.push(now);

				const stageValidTimesInSpecifiedTimeSection = this.stageValidStatistics.filter(ele => { 
					ele + COUNTER_INVALID_STAGE_TIME_SECTION > now;
				}).length;

				if(stageValidTimesInSpecifiedTimeSection >= this.threshould * unl.length)
				{
					if(this.state === COUNTER_STATE_IDLE)
					{
						this.state = COUNTER_STATE_PROCESSING;

						p2p.sendAll(PROTOCOL_CMD_ACOUNTER_REQUEST);

						this.timeout = setTimeout(this.handler, COUNTER_HANDLER_TIME_DETAY);
					}
				}
			}
			break;
			case PROTOCOL_CMD_ACOUNTER_REQUEST:
			{
				const counterData = new CounterData();

				counterData.round = this.ripple.round;
				counterData.stage = this.ripple.stage;
				if(this.ripple.state === RIPPLE_STAGE_AMALGAMATE)
				{
					counterData.primaryConsensusTime = this.ripple.amalgamate.averagePrimaryTime;
					counterData.finishConsensusTime = this.ripple.amalgamate.averageFinishTime;
					counterData.pastTime = Date.now() - this.ripple.amalgamate.primary.consensusBeginTime;
				}
				else if(this.ripple.state === RIPPLE_STAGE_CANDIDATE_AGREEMENT)
				{
					counterData.primaryConsensusTime = this.ripple.candidateAgreement.averagePrimaryTime;
					counterData.finishConsensusTime = this.ripple.candidateAgreement.averageFinishTime;
					counterData.pastTime = Date.now() - this.ripple.candidateAgreement.primary.consensusBeginTime;
				}
				else
				{
					counterData.primaryConsensusTime = this.ripple.blockAgreement.averagePrimaryTime;
					counterData.finishConsensusTime = this.ripple.blockAgreement.averageFinishTime;
					counterData.pastTime = Date.now() - this.ripple.blockAgreement.primary.consensusBeginTime;
				}
				counterData.sign(privateKey);

				p2p.send(address, PROTOCOL_CMD_ACOUNTER_RESPONSE, counterData.serialize())
			}
			break;
			case PROTOCOL_CMD_ACOUNTER_RESPONSE:
			{
				if(this.state === COUNTER_STATE_IDLE)
				{
					return;
				}

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

module.exports = Counter;