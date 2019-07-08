const { CHEAT_REASON_REPEAT_SYNC_FINISH, TIMEOUT_REASON_OFFLINE, TIMEOUT_REASON_DEFER, RIPPLE_STAGE_BLOCK_AGREEMENT, COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE, RIPPLE_STATE_PERISH_NODE, RIPPLE_STATE_TRANSACTIONS_CONSENSUS, RIPPLE_STATE_STAGE_CONSENSUS, STAGE_DATA_EXCHANGE_TIMEOUT, STAGE_STAGE_SYNCHRONIZE_TIMEOUT, STAGE_MAX_FINISH_RETRY_TIMES, STAGE_STATE_EMPTY, STAGE_STATE_DATA_EXCHANGE_PROCEEDING, STAGE_STATE_DATA_EXCHANGE_FINISH_SUCCESS_AND_SYNCHRONIZE_PROCEEDING, STAGE_STATE_DATA_EXCHANGE_FINISH_TIMEOUT_AND_SYNCHRONIZE_PROCEEDING } = require("../../constant");
const utils = require("../../../depends/utils");
const assert = require("assert");
const Sender = require("../sender");
const AsyncEventEmitter = require('async-eventemitter');
const Base = require("../data/base");

const stripHexPrefix = utils.stripHexPrefix;
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
				this.fatal(`args, ${process[Symbol.for("getStackInfo")]()}`);
				
			}, loggerHandler),
		}

		// timeout nodes
		this.timeoutNodes = [];

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
				this.logger.error(`Stage dataExchange, stage: ${this.ripple.stage}, saveDataExchangeTimeConsume throw exception, ${process[Symbol.for("getStackInfo")](e)}`);
			});

			if(result)
			{
				this.logger.info(`Stage dataExchange, stage: ${this.ripple.stage}, dataExchange is over success`);

				this.state = STAGE_STATE_DATA_EXCHANGE_FINISH_SUCCESS_AND_SYNCHRONIZE_PROCEEDING;

				// if state is transactions consensus and stage sync success, reset counter
				if(this.ripple.state === RIPPLE_STATE_TRANSACTIONS_CONSENSUS)
				{
					this.ripple.counter.resetTrigger();
				}
			}
			else
			{
				// record the timeout node
				for(let i = 0; i < unl.length; i++)
				{
					if(!this.dataExchange.checkIfNodeIsFinished(stripHexPrefix(unl[i].address)))
					{
						if(p2p.checkIfConnectionIsOpen(Buffer.from(unl[i].address, "hex")))
						{
							this.timeoutNodes.push({
								address: unl[i].address,
								reason: TIMEOUT_REASON_DEFER
							});
						}
						else
						{
							this.timeoutNodes.push({
								address: unl[i].address,
								reason: TIMEOUT_REASON_OFFLINE
							});
						}
					}
				}

				this.logger.warn(`Stage dataExchange, stage: ${this.ripple.stage}, dataExchange is over because of timeout`);

				// data exchange is failed, try to stage consensus
				if(this.ripple.counter.checkIfTriggered() && this.ripple.counter.state === STAGE_STATE_EMPTY && this.ripple.state !== RIPPLE_STATE_PERISH_NODE)
				{
					loggerStageConsensus.warn(`Counter handleMessage, begin to synchronize stage actively, stage: ${this.ripple.stage}`);

					this.ripple.counter.startStageSynchronize(COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE);

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
				this.logger.info(`Stage stageSynchronize, stage: ${this.ripple.stage}, stage synchronize is over success`);

				// record synchronize time consume
				mysql.saveStageSynchronizeTimeConsume(this.ripple.stage, this.stageSynchronize.consensusTimeConsume).catch(e => {
					this.logger.error(`Stage stageSynchronize, stage: ${this.ripple.stage}, saveStageSynchronizeTimeConsume throw exception, ${process[Symbol.for("getStackInfo")](e)}`);
				});

				// handle abnormal nodes
				this.ripple.handleTimeoutNodes(this.timeoutNodes);
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
				// record the timeout node
				for(let i = 0; i < unl.length; i++)
				{
					if(!this.stageSynchronize.checkIfNodeIsFinished(stripHexPrefix(unl[i].address)))
					{
						if(p2p.checkIfConnectionIsOpen(Buffer.from(unl[i].address, "hex")))
						{
							this.timeoutNodes.push({
								address: unl[i].address,
								reason: TIMEOUT_REASON_DEFER
							});
						}
						else
						{
							this.timeoutNodes.push({
								address: unl[i].address,
								reason: TIMEOUT_REASON_OFFLINE
							});
						}
					}
				}

				if(this.leftSynchronizeTryTimes > 0)
				{
					this.logger.info(`Stage stageSynchronize, stage: ${this.ripple.stage}, stage synchronize is failed, retry ${STAGE_MAX_FINISH_RETRY_TIMES - this.leftSynchronizeTryTimes + 1}`);

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
					this.logger.warn(`Stage stageSynchronize, stage: ${this.ripple.stage}, stage synchronize is over because of timeout`);

					// record synchronize time consume
					mysql.saveStageSynchronizeTimeConsume(this.ripple.stage, this.stageSynchronize.consensusTimeConsume).catch(e => {
						this.logger.error(`Stage stageSynchronize, stage: ${this.ripple.stage}, saveStageSynchronizeTimeConsume throw exception, ${process[Symbol.for("getStackInfo")](e)}`);
					});

					// handle abnormal nodes
					this.ripple.handleTimeoutNodes(this.timeoutNodes);
					this.ripple.handleCheatedNodes(this.cheatedNodes);

					// data exchange is failed, try to stage consensus
					if(this.ripple.counter.checkIfTriggered() && this.ripple.counter.state === STAGE_STATE_EMPTY && this.ripple.state !== RIPPLE_STATE_PERISH_NODE)
					{
						loggerStageConsensus.warn(`Counter handleMessage, begin to synchronize stage actively again, stage: ${this.ripple.stage}`);
						
						this.ripple.counter.startStageSynchronize(COUNTER_CONSENSUS_ACTION_REUSE_CACHED_TRANSACTIONS_AND_AMALGAMATE);

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
		assert(typeof address === "string", `Stage recordDataExchangeFinishNode, address should be a String, now is ${typeof address}`);

		this.dataExchange.recordFinishNode(address);
	}

	/**
	 * @param {Base} candidate
	 * @param {Array} candidates
	 * @param {String} address
	 */
	validate(candidate, candidates, address, {
		sigCheck, 
		addressCheck, 
		dataExchangeCheck
	} = {
		sigCheck: true, 
		addressCheck: true, 
		dataExchangeCheck: true})
	{
		assert(candidate instanceof Base, `${this.name} Stage, candidate should be an instance of Base, now is ${typeof candidate}`);
		assert(Array.isArray(candidates), `${this.name} Stage, candidates should be an Array, now is ${typeof candidates}`);
		assert(typeof address === 'string', `${this.name} Stage, address should be a String, now is ${typeof address}`);

		if(sigCheck && candidate.validate())
		{
			if(addressCheck && address !== candidate.from.toString("hex"))
			{
				// address is invalid
				this.cheatedNodes.push({
					address: address.toString('hex'),
					reason: CHEAT_REASON_INVALID_ADDRESS
				});
				
				this.logger.info(`${this.name} Stage validate, address should be ${address}, now is ${candidate.from.toString("hex")}`);
			}
			else
			{
				if(dataExchangeCheck && this.checkIfNodeFinishDataExchange(address))
				{
					this.logger.info(`${this.name} Stage validate, address: ${address}, send the same exchange data`);
					
					// repeat data exchange
					this.cheatedNodes.push({
						address: address.toString('hex'),
						reason: CHEAT_REASON_REPEAT_DATA_EXCHANGE
					});
				}
				else
				{
					candidates.push(candidate);
				}
			}
		}
		else
		{
			// invalid sig
			this.cheatedNodes.push({
				address: address.toString('hex'),
				reason: CHEAT_REASON_INVALID_SIG
			});

			this.logger.info(`${this.name} Stage validate, address: ${address}, validate failed`);
		}

		this.dataExchange.recordFinishNode(address);
	}

	/**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
	handleMessage(address, cmd, data)
	{
		assert(Buffer.isBuffer(address), `Stage handleMessage, address should be an Buffer, now is ${typeof address}`);
		assert(typeof cmd === "number", `Stage handleMessage, cmd should be a Number, now is ${typeof cmd}`);
		assert(Buffer.isBuffer(data), `Stage handleMessage, data should be an Buffer, now is ${typeof data}`);

		assert(this.state !== STAGE_STATE_EMPTY, `Stage handleMessage, address ${address.toString("hex")}, message should not enter an emtpy stage`);

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
					this.logger.fatal(`Stage handleMessage, stage: ${this.ripple.stage}, stage state is empty, can not process messages`);

					process.exit(1);
				}
			}
		}
	}

	reset()
	{
		this.timeoutNodes = [];
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

	/**
	 * @param {String} address
	 */
	checkIfNodeFinishDataExchange(address)
	{
		assert(typeof address === "string", `Stage checkIfNodeFinishDataExchange, address should be a String, now is ${typeof address}`);

		return this.dataExchange.checkIfNodeIsFinished(address)
	}
}

module.exports = Stage;