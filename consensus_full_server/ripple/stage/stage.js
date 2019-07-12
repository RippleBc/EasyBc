const { CHEAT_REASON_INVALID_ADDRESS, CHEAT_REASON_INVALID_SIG, CHEAT_REASON_REPEAT_DATA_EXCHANGE, CHEAT_REASON_REPEAT_SYNC_FINISH, RIPPLE_STAGE_BLOCK_AGREEMENT, COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_STAGE_FALL_BEHIND, RIPPLE_STATE_PERISH_NODE, RIPPLE_STATE_TRANSACTIONS_CONSENSUS, RIPPLE_STATE_STAGE_CONSENSUS, STAGE_DATA_EXCHANGE_TIMEOUT, STAGE_STAGE_SYNCHRONIZE_TIMEOUT, STAGE_MAX_FINISH_RETRY_TIMES, STAGE_STATE_EMPTY, STAGE_STATE_DATA_EXCHANGE_PROCEEDING, STAGE_STATE_DATA_EXCHANGE_FINISH_SUCCESS_AND_SYNCHRONIZE_PROCEEDING, STAGE_STATE_DATA_EXCHANGE_FINISH_TIMEOUT_AND_SYNCHRONIZE_PROCEEDING } = require("../../constant");
const utils = require("../../../depends/utils");
const assert = require("assert");
const Sender = require("../sender");
const AsyncEventEmitter = require('async-eventemitter');
const Base = require("../data/base");

const bufferToInt = utils.bufferToInt;
const Buffer = utils.Buffer;

const loggerPerishNode = process[Symbol.for("loggerPerishNode")];
const loggerStageConsensus = process[Symbol.for("loggerStageConsensus")];
const loggerConsensus = process[Symbol.for("loggerConsensus")];
const p2p = process[Symbol.for("p2p")];
const mysql = process[Symbol.for("mysql")];
const unl = process[Symbol.for("unl")];

class Stage extends AsyncEventEmitter
{
	constructor(opts)
	{
		super();

		this.state = STAGE_STATE_EMPTY;

		const loggerHandler = {
			apply: (target, ctx, args) => {
				switch(this.ripple.state)
				{
					case RIPPLE_STATE_TRANSACTIONS_CONSENSUS: 
					{
						Reflect.apply(target, loggerConsensus, args)
					}
					break;

					case RIPPLE_STATE_STAGE_CONSENSUS:
					{
						Reflect.apply(target, loggerStageConsensus, args)
					}
					break;

					case RIPPLE_STATE_PERISH_NODE:
					{
						Reflect.apply(target, loggerPerishNode, args)
					}
					break;
				}
			}
		}

		this.logger = {
			trace: new Proxy(function(args) {
				this.trace(args);
			}, loggerHandler),

			debug: new Proxy(function(args) {
				this.debug(args);
			}, loggerHandler),

			info: new Proxy(function(args) {
				this.info(args);
			}, loggerHandler),

			warn: new Proxy(function(args) {
				this.warn(args);
			}, loggerHandler),

			error: new Proxy(function(args) {
				this.error(args);
			}, loggerHandler),

			fatal: new Proxy(function(args) {
				this.fatal(`${process[Symbol.for("getStackInfo")](args)}`);
				
			}, loggerHandler),
		}

		// cheated nodes
		this.cheatedNodes = [];

		// compute synchronize times
		this.totalSynchronizeTime = 0;
		this.leftSynchronizeTryTimes = STAGE_MAX_FINISH_RETRY_TIMES;

		this.synchronize_state_request_cmd = opts.synchronize_state_request_cmd;
		this.synchronize_state_response_cmd = opts.synchronize_state_response_cmd;
		this.name = opts.name;

		this.dataExchange = new Sender(result => {
			// record data exchange time consume
			mysql.saveDataExchangeTimeConsume(this.ripple.stage, this.dataExchange.consensusTimeConsume).catch(e => {
				this.logger.error(`${this.name} Stage dataExchange, stage: ${this.ripple.stage}, saveDataExchangeTimeConsume throw exception, ${process[Symbol.for("getStackInfo")](e)}`);
			});

			// handle abnormal nodes
			this.ripple.handleTimeoutNodes(this.dataExchange.timeoutNodes);

			if(result)
			{
				this.logger.info(`${this.name} Stage dataExchange, stage: ${this.ripple.stage}, dataExchange is over success`);

				this.state = STAGE_STATE_DATA_EXCHANGE_FINISH_SUCCESS_AND_SYNCHRONIZE_PROCEEDING;

				// if state is transactions consensus and stage sync success, reset counter
				if(this.ripple.state === RIPPLE_STATE_TRANSACTIONS_CONSENSUS)
				{
					this.ripple.counter.resetTrigger();
				}
			}
			else
			{
				this.logger.warn(`${this.name} Stage dataExchange, stage: ${this.ripple.stage}, dataExchange is over because of timeout`);

				// data exchange is failed, try to stage consensus
				if(this.ripple.counter.checkIfTriggered() && this.ripple.counter.state === STAGE_STATE_EMPTY && this.ripple.state !== RIPPLE_STATE_PERISH_NODE)
				{
					loggerStageConsensus.warn(`${this.name} Counter handleMessage, begin to synchronize stage actively, stage: ${this.ripple.stage}`);

					this.ripple.counter.startStageSynchronize({
						action: COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_STAGE_FALL_BEHIND
					});

					return;
				}

				this.state = STAGE_STATE_DATA_EXCHANGE_FINISH_TIMEOUT_AND_SYNCHRONIZE_PROCEEDING;
			}

			this.stageSynchronize.start();
			p2p.sendAll(this.synchronize_state_request_cmd);

		}, STAGE_DATA_EXCHANGE_TIMEOUT);

		this.stageSynchronize = new Sender(result => {
			this.totalSynchronizeTime += this.stageSynchronize.consensusTimeConsume;

			if(result)
			{
				this.logger.info(`${this.name} Stage stageSynchronize, stage: ${this.ripple.stage}, stage synchronize is over success`);

				// record synchronize time consume
				mysql.saveStageSynchronizeTimeConsume(this.ripple.stage, this.stageSynchronize.consensusTimeConsume).catch(e => {
					this.logger.error(`${this.name} Stage stageSynchronize, stage: ${this.ripple.stage}, saveStageSynchronizeTimeConsume throw exception, ${process[Symbol.for("getStackInfo")](e)}`);
				});

				// handle abnormal nodes
				this.ripple.handleTimeoutNodes(this.stageSynchronize.timeoutNodes);
				this.ripple.handleCheatedNodes(this.cheatedNodes);

				// if state is transactions consensus and stage sync success, reset counter
				if(this.ripple.state === RIPPLE_STATE_TRANSACTIONS_CONSENSUS)
				{
					this.ripple.counter.resetTrigger();
				}
				
				//
				this.handler(true);
			}
			else
			{
				if(this.leftSynchronizeTryTimes > 0)
				{
					this.logger.warn(`${this.name} Stage stageSynchronize, stage: ${this.ripple.stage}, stage synchronize is failed, retry ${STAGE_MAX_FINISH_RETRY_TIMES - this.leftSynchronizeTryTimes + 1}`);

					// handle abnormal nodes
					this.ripple.handleTimeoutNodes(this.stageSynchronize.timeoutNodes);

					// sync again
					this.stageSynchronize.reset();
					this.stageSynchronize.start();

					for(let node of unl)
					{
						if(!this.stageSynchronize.checkIfNodeIsFinished(node.address))
						{
							p2p.send(Buffer.from(node.address, "hex"), this.synchronize_state_request_cmd);
						}
					}

					this.leftSynchronizeTryTimes -= 1;
				}
				else
				{
					this.logger.warn(`${this.name} Stage stageSynchronize, stage: ${this.ripple.stage}, stage synchronize is over because of timeout`);

					// record synchronize time consume
					mysql.saveStageSynchronizeTimeConsume(this.ripple.stage, this.stageSynchronize.consensusTimeConsume).catch(e => {
						this.logger.error(`${this.name} Stage stageSynchronize, stage: ${this.ripple.stage}, saveStageSynchronizeTimeConsume throw exception, ${process[Symbol.for("getStackInfo")](e)}`);
					});

					// handle abnormal nodes
					this.ripple.handleTimeoutNodes(this.stageSynchronize.timeoutNodes);
					this.ripple.handleCheatedNodes(this.cheatedNodes);

					// data exchange is failed, try to stage consensus
					if(this.ripple.counter.checkIfTriggered() && this.ripple.counter.state === STAGE_STATE_EMPTY && this.ripple.state !== RIPPLE_STATE_PERISH_NODE)
					{
						loggerStageConsensus.warn(`${this.name} Counter handleMessage, begin to synchronize stage actively again, stage: ${this.ripple.stage}`);
						
						this.ripple.counter.startStageSynchronize({
							action: COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE_BECAUSE_OF_STAGE_FALL_BEHIND
						});

						return
					}

					this.handler(false);
				}
			}
		}, STAGE_STAGE_SYNCHRONIZE_TIMEOUT);
	}

	start()
	{
		this.state = STAGE_STATE_DATA_EXCHANGE_PROCEEDING;
		
		if(unl.length > 0)
		{
			this.dataExchange.start();
		}
		else 
		{
			if(this.ripple.stage === RIPPLE_STAGE_BLOCK_AGREEMENT)
			{
				// wait for block agreement run finished
				this.on("runBlockFinished", () => {
					this.handler(true);
				});
			}
			else
			{
				// wait for amalgamate run or candidate agreement run finished
				process.nextTick(() => {
					this.handler(true);
				})
			}
		}
	}

	/**
	 * @param {String} address
	 */
	recordDataExchangeFinishNode(address)
	{
		assert(typeof address === "string", `${this.name} Stage recordDataExchangeFinishNode, address should be a String, now is ${typeof address}`);

		this.dataExchange.recordFinishNode(address);
	}

	/**
	 * @param {Base} candidate
	 * @param {Array} candidates
	 * @param {String} address
	 */
	validateAndProcessExchangeData(candidate, candidates, address, {
		sigCheck = true, 
		addressCheck = true, 
		dataExchangeCheck = true
	} = {
		sigCheck: true, 
		addressCheck: true, 
		dataExchangeCheck: true})
	{
		assert(candidate instanceof Base, `${this.name} Stage, candidate should be an instance of Base, now is ${typeof candidate}`);
		assert(Array.isArray(candidates), `${this.name} Stage, candidates should be an Array, now is ${typeof candidates}`);
		assert(typeof address === 'string', `${this.name} Stage, address should be a String, now is ${typeof address}`);

		// check if send repeat exchange data
		if(dataExchangeCheck && this.dataExchange.checkIfNodeIsFinished(address))
		{
			this.logger.error(`${this.name} Stage validate, address: ${address}, send the same exchange data`);
			
			// repeat data exchange
			this.cheatedNodes.push({
				address: address.toString('hex'),
				reason: CHEAT_REASON_REPEAT_DATA_EXCHANGE
			});

			return;
		}

		// record finish node
		this.dataExchange.recordFinishNode(address);

		// check sig
		if(sigCheck && !candidate.validate())
		{
			// invalid sig
			this.cheatedNodes.push({
				address: address.toString('hex'),
				reason: CHEAT_REASON_INVALID_SIG
			});

			this.logger.error(`${this.name} Stage validate, address: ${address}, validate failed`);

			return
		}

		// check address
		if(addressCheck && address !== candidate.from.toString("hex"))
		{
			// address is invalid
			this.cheatedNodes.push({
				address: address.toString('hex'),
				reason: CHEAT_REASON_INVALID_ADDRESS
			});
			
			this.logger.error(`${this.name} Stage validate, address should be ${address}, now is ${candidate.from.toString("hex")}`);
			
			return
		}

		candidates.push(candidate);
	}

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage(address, cmd, data)
	{
		assert(Buffer.isBuffer(address), `${this.name} Stage handleMessage, address should be an Buffer, now is ${typeof address}`);
		assert(typeof cmd === "number", `${this.name} Stage handleMessage, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(data), `${this.name} Stage handleMessage, data should be an Buffer, now is ${typeof data}`);

		assert(this.state !== STAGE_STATE_EMPTY, `${this.name} Stage handleMessage, address ${address.toString("hex")}, message should not enter an emtpy stage`);

		switch(cmd)
		{
			case this.synchronize_state_request_cmd:
			{
				p2p.send(address, this.synchronize_state_response_cmd, this.state);
			}
			break;
			case this.synchronize_state_response_cmd:
			{
				const state = bufferToInt(data);

				if(state === STAGE_STATE_DATA_EXCHANGE_PROCEEDING)
				{

				}
				else if(state === STAGE_STATE_DATA_EXCHANGE_FINISH_TIMEOUT_AND_SYNCHRONIZE_PROCEEDING)
				{
					if(this.stageSynchronize.checkIfNodeIsFinished(address.toString("hex")))
					{
						this.cheatedNodes.push({
							address: address.toString('hex'),
							reason: CHEAT_REASON_REPEAT_SYNC_FINISH,
							weight: 1
						})
					}
					else
					{
						this.stageSynchronize.recordFinishNode(address.toString("hex"));
					}
					
				}
				else if(state === STAGE_STATE_DATA_EXCHANGE_FINISH_SUCCESS_AND_SYNCHRONIZE_PROCEEDING)
				{
					if(this.stageSynchronize.checkIfNodeIsFinished(address.toString("hex")))
					{
						this.cheatedNodes.push({
							address: address.toString('hex'),
							reason: CHEAT_REASON_REPEAT_SYNC_FINISH,
							weight: 1
						})
					}
					else
					{
						this.stageSynchronize.recordFinishNode(address.toString("hex"));
					}
				}
				else
				{
					this.logger.fatal(`${this.name} Stage handleMessage, stage: ${this.ripple.stage}, stage state is empty, can not process messages`);

					process.exit(1);
				}
			}
		}
	}

	reset()
	{
		this.cheatedNodes = [];

		this.state = STAGE_STATE_EMPTY;
		this.leftSynchronizeTryTimes = STAGE_MAX_FINISH_RETRY_TIMES;

		this.dataExchange.reset();
		this.stageSynchronize.reset();
	}

	checkIfDataExchangeIsFinish()
	{
		return this.state === STAGE_STATE_DATA_EXCHANGE_FINISH_TIMEOUT_AND_SYNCHRONIZE_PROCEEDING || this.state === STAGE_STATE_DATA_EXCHANGE_FINISH_SUCCESS_AND_SYNCHRONIZE_PROCEEDING;
	}

	checkDataExchangeIsProceeding()
	{
		return this.state === STAGE_STATE_DATA_EXCHANGE_PROCEEDING;
	}
}

module.exports = Stage;