const CounterData = require("./data/counter");
const { unl } = require("../config.json");
const utils = require("../../depends/utils");
const process = require("process");
const { COUNTER_CONSENSUS_STAGE_THRESHOULD, COUNTER_HANDLER_TIME_DETAY, COUNTER_INVALID_STAGE_TIME_SECTION, COUNTER_STATE_IDLE, COUNTER_STATE_PROCESSING, RIPPLE_STAGE_AMALGAMATE, RIPPLE_STAGE_CANDIDATE_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE, PROTOCOL_CMD_ACOUNTER_REQUEST, PROTOCOL_CMD_ACOUNTER_RESPONSE } = require("../constant");

const rlp = utils.rlp;
const sha3 = utils.sha3;
const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];

class Counter
{
	constructor(ripple)
	{

		this.ripple = ripple;

		this.state = COUNTER_STATE_IDLE;

		// 
		this.counters = [];

		// statistic the frequency of fall behind
		this.invalidStageTimeStatistics = [];

		//
		this.cheatedNodes = [];

		// should store in database
		this.threshould = COUNTER_CONSENSUS_STAGE_THRESHOULD;
	}

	reset()
	{
		this.state = COUNTER_STATE_IDLE;
		this.counters = [];
		this.invalidStageTimeStatistics = [];
		
		clearTimeout(this.timeout);
	}

	handler()
	{
		const countersMap = new Map();

		this.counters.forEach(counter => {
			const key = sha3(rlp.encode([counter.round, counter.stage]));

			if(countersMap.has(key))
			{
				const { count, timeConsumes } = rlpcountersMap.get(key);

				timeConsumes.primaryConsensusTime += bufferToInt(counter.primaryConsensusTime);
				timeConsumes.finishConsensusTime += bufferToInt(counter.finishConsensusTime);
				timeConsumes.pastTime += bufferToInt(counter.pastTime);

				countersMap.set(key, {
					count: count + 1,
					round: counter.round,
					stage: counter.stage,
					timeConsumes: timeConsumes
				});
			}
			else
			{
				countersMap.set(key, {
					count: 1,
					round: counter.round,
					stage: counter.stage,
					timeConsumes: {
						primaryConsensusTime: bufferToInt(counter.primaryConsensusTime),
						finishConsensusTime: bufferToInt(counter.finishConsensusTime),
						pastTime: bufferToInt(counter.pastTime)
					}
				});
			}
		});

		const sortedCounters = [...countersMap].sort(counter => {
			return -counter[1].count;
		});

		if(sortedCounters[0])
		{
			const count = sortedCounters[0][1].count
			const round = sortedCounters[0][1].round;
			const stage = sortedCounters[0][1].stage;
			const timeConsumes = sortedCounters[0][1].timeConsumes;

			const primaryConsensusTime = timeConsumes.primaryConsensusTime / count;
			const finishConsensusTime = timeConsumes.finishConsensusTime / count;
			const pastTime = timeConsumes.pastTime / count;

			this.ripple.handleCounter(round, stage, primaryConsensusTime, finishConsensusTime, pastTime);
		}

		this.ripple.handleCheatedNodes(this.cheatedNodes);
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
				logger.error(`Counter handleMessage, stage may be invalid, current own round: ${this.ripple.round}, stage: ${this.ripple.stage}`);

				// compute the stage invalid times over a specified period of time 
				const now = Date.now();

				this.invalidStageTimeStatistics.push(now);

				const stageValidTimesInSpecifiedTimeSection = this.invalidStageTimeStatistics.filter(ele => { 
					return ele + COUNTER_INVALID_STAGE_TIME_SECTION > now;
				}).length;

				// if stage invalid times over a specified period of time is exceeds the limit, try to synchronize the stage
				if(stageValidTimesInSpecifiedTimeSection >= this.threshould * unl.length)
				{
					if(this.state === COUNTER_STATE_IDLE)
					{
						this.state = COUNTER_STATE_PROCESSING;

						p2p.sendAll(PROTOCOL_CMD_ACOUNTER_REQUEST);

						this.timeout = setTimeout(() => {

							logger.error("Counter handleMessage, get stage infomation is over because of timeout");

							this.handler(false);

							this.reset();
						}, COUNTER_HANDLER_TIME_DETAY);
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
				else if(this.ripple.state === RIPPLE_STAGE_BLOCK_AGREEMENT || this.ripple.state === RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK)
				{
					counterData.primaryConsensusTime = this.ripple.blockAgreement.averagePrimaryTime;
					counterData.finishConsensusTime = this.ripple.blockAgreement.averageFinishTime;
					counterData.pastTime = Date.now() - this.ripple.blockAgreement.primary.consensusBeginTime;
				}
				else
				{
					logger.fatal("Counter handleMessage, invalid ripple stage");

					process.exit(1);
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
						this.cheatedNodes.push(address);

						logger.error(`Counter handleMessage, address should be ${address.toString("hex")}, now is ${counterData.from.toString("hex")}`);
					}
					else
					{
						this.counters.push(counterData);
					}
				}
				else
				{
					this.cheatedNodes.push(address);
					
					logger.error(`Counter handleMessage, address ${address.toString("hex")}, validate failed`);
				}

				if(this.counters.length === unl.length)
				{
					clearTimeout(this.timeout);

					logger.trace("Counter handleMessage, get stage infomation is over success");

					this.handler(true);
					
					this.reset();
				}
			}
			break;
		}
	}
}

module.exports = Counter;