const CounterData = require("./data/counter");
const { unl } = require("../config.json");
const utils = require("../../depends/utils");
const process = require("process");
const { RIPPLE_MAX_ROUND, RIPPLE_STATE_STAGE_CONSENSUS, COUNTER_CONSENSUS_STAGE_THRESHOULD, COUNTER_HANDLER_TIME_DETAY, COUNTER_INVALID_STAGE_TIME_SECTION, COUNTER_STATE_IDLE, COUNTER_STATE_PROCESSING, RIPPLE_STAGE_AMALGAMATE, RIPPLE_STAGE_CANDIDATE_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT, RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK, PROTOCOL_CMD_INVALID_AMALGAMATE_STAGE, PROTOCOL_CMD_INVALID_CANDIDATE_AGREEMENT_STAGE, PROTOCOL_CMD_INVALID_BLOCK_AGREEMENT_STAGE, PROTOCOL_CMD_STAGE_INFO_REQUEST, PROTOCOL_CMD_STAGE_INFO_RESPONSE } = require("../constant");

const rlp = utils.rlp;
const sha3 = utils.sha3;
const bufferToInt = utils.bufferToInt;

const p2p = process[Symbol.for("p2p")];
const logger = process[Symbol.for("loggerConsensus")];
const privateKey = process[Symbol.for("privateKey")];
const mysql = process[Symbol.for("mysql")];

class Counter
{
	constructor(ripple)
	{

		this.ripple = ripple;

		this.state = COUNTER_STATE_IDLE;

		// 
		this.counters = [];

		//
		this.stageSynchronizeTrigger = [];

		//
		this.cheatedNodes = [];
	}

	reset()
	{
		this.state = COUNTER_STATE_IDLE;
		this.counters = [];
		this.stageSynchronizeTrigger = [];
		
		clearTimeout(this.timeout);
	}

	handler()
	{
		const countersMap = new Map();

		this.counters.forEach(counter => {
			const key = sha3(rlp.encode([counter.round, counter.stage]));

			if(countersMap.has(key))
			{
				const { count, timeConsumes } = countersMap.get(key);

				timeConsumes.dataExchangeTimeConsume += bufferToInt(counter.dataExchangeTimeConsume);
				timeConsumes.stageSynchronizeTimeConsume += bufferToInt(counter.stageSynchronizeTimeConsume);
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
						dataExchangeTimeConsume: bufferToInt(counter.dataExchangeTimeConsume),
						stageSynchronizeTimeConsume: bufferToInt(counter.stageSynchronizeTimeConsume),
						pastTime: bufferToInt(counter.pastTime)
					}
				});
			}
		});

		const sortedCounters = [...countersMap].sort(counter => {
			return -(counter[1].count * RIPPLE_MAX_ROUND + counter[1].round);
		});

		if(sortedCounters[0] && sortedCounters[0][1].count)
		{
			const count = sortedCounters[0][1].count
			const round = sortedCounters[0][1].round;
			const stage = sortedCounters[0][1].stage;
			const timeConsumes = sortedCounters[0][1].timeConsumes;

			const dataExchangeTimeConsume = timeConsumes.dataExchangeTimeConsume / count;
			const stageSynchronizeTimeConsume = timeConsumes.stageSynchronizeTimeConsume / count;
			const pastTime = timeConsumes.pastTime / count;

			this.ripple.handleCounter(round, stage, dataExchangeTimeConsume, stageSynchronizeTimeConsume, pastTime);
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
				// check if need to synchronize stage
				const now = Date.now();
				this.stageSynchronizeTrigger.push(now);
				if(this.stageSynchronizeTrigger.filter(ele => (ele + COUNTER_INVALID_STAGE_TIME_SECTION) > now).length >= COUNTER_CONSENSUS_STAGE_THRESHOULD * unl.length)
				{
					if(this.state == COUNTER_STATE_PROCESSING)
					{
						return;
					}

					logger.info(`Counter handleMessage, begin to synchronize stage, current own round: ${this.ripple.round}, stage: ${this.ripple.stage}`);

					this.ripple.reset();
					this.ripple.state = RIPPLE_STATE_STAGE_CONSENSUS;

					this.state = COUNTER_STATE_PROCESSING;

					p2p.sendAll(PROTOCOL_CMD_STAGE_INFO_REQUEST);

					this.timeout = setTimeout(() => {

						logger.info("Counter handleMessage, get stage infomation is over because of timeout");

						this.handler(false);

						this.reset();
					}, COUNTER_HANDLER_TIME_DETAY);
				}
			}
			break;
			case PROTOCOL_CMD_STAGE_INFO_REQUEST:
			{
				if(this.state == COUNTER_STATE_PROCESSING)
				{
					return;
				}
					
				(async () => {
					const counterData = new CounterData();

					counterData.round = this.ripple.round;
					counterData.stage = this.ripple.stage;

					if(this.ripple.stage === RIPPLE_STAGE_AMALGAMATE)
					{
						counterData.pastTime = Date.now() - this.ripple.amalgamate.dataExchange.consensusBeginTime;
					}
					else if(this.ripple.stage === RIPPLE_STAGE_CANDIDATE_AGREEMENT)
					{
						counterData.pastTime = Date.now() - this.ripple.candidateAgreement.dataExchange.consensusBeginTime;
					}
					else if(this.ripple.stage === RIPPLE_STAGE_BLOCK_AGREEMENT || this.ripple.state === RIPPLE_STAGE_BLOCK_AGREEMENT_PROCESS_BLOCK)
					{
						counterData.pastTime = Date.now() - this.ripple.blockAgreement.dataExchange.consensusBeginTime;
					}
					else
					{
						logger.fatal("Counter handleMessage, invalid ripple stage");

						process.exit(1);
					}

					counterData.dataExchangeTimeConsume = await mysql.getDataExchangeTimeConsume(this.ripple.stage);
					counterData.stageSynchronizeTimeConsume = await mysql.getStageSynchronizeTimeConsume(this.ripple.stage);

					counterData.sign(privateKey);

					p2p.send(address, PROTOCOL_CMD_STAGE_INFO_RESPONSE, counterData.serialize())
				})().catch(e => {
					logger.error(e);
				})
			}
			break;
			case PROTOCOL_CMD_STAGE_INFO_RESPONSE:
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

						logger.info(`Counter handleMessage, address should be ${address.toString("hex")}, now is ${counterData.from.toString("hex")}`);
					}
					else
					{
						this.counters.push(counterData);
					}
				}
				else
				{
					this.cheatedNodes.push(address);
					
					logger.info(`Counter handleMessage, address ${address.toString("hex")}, validate failed`);
				}

				if(this.counters.length === unl.length)
				{
					this.handler(true);
					
					this.reset();
				}
			}
			break;
		}
	}
}

module.exports = Counter;