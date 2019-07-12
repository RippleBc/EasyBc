const assert = require("assert");
const Message = require("./message");
const MessageChunk = require("./message_chunk");
const MessageChunkQueue = require("./message_chunk_queue");
const Socket = require("net").Socket;
const Token = require("../manager/token");
const crypto = require("crypto");
const process = require("process");
const AsyncEventEmitter = require("async-eventemitter");
const utils = require("../../utils");
const { AUTHORIZE_FAILED_BECAUSE_OF_TIMEOUT, AUTHORIZE_FAILED_BECAUSE_OF_INVALID_SIGNATURE } = require("../constant");

const Buffer = utils.Buffer;

const END_CLEAR_SEND_BUFFER_TIME_DEAY = 1000 * 5;
const HEART_BEAT_TIME = 1000 * 10;
const AUTHORIZE_DELAY_TIME = 5000;

const AUTHORIZE_GET_NONCE_CMD = 1;
const AUTHORIZE_RETURN_NONCE_CMD = 2;
const AUTHORIZE_BEGIN_CMD = 3;
const AUTHORIZE_SUCCESS_CMD = 4;
const AUTHORIZE_FAILED_CMD = 5;
const AUTHORIZE_END_CMD = 6;

class Connection extends AsyncEventEmitter
{
	constructor(opts)
	{
		super();

		assert(opts.socket instanceof Socket, `Connection	constructor, opts.socket should be a Socket Object, now is ${typeof opts.socket}`);
		assert(typeof opts.dispatcher	=== "function", `Connection	constructor, opts.dispatcher should be a Function, now is ${typeof opts.dispatcher}`);
		assert(typeof opts.logger	=== "object", `Connection	constructor, opts.logger should be an Object, now is ${typeof opts.logger}`);

		if(opts.address)
		{
			assert(Buffer.isBuffer(opts.address), `Connection constructor, opts.address should be an Buffer, now is ${typeof opts.address}`);
			this.address = opts.address;
		}

		this.socket = opts.socket;
		this.dispatcher = opts.dispatcher;
		this.logger = opts.logger;

		this.nonce = crypto.randomBytes(32);

		// if other end's write channel is closed
		this.readChannelClosed = false;
		// if own write channel is closed
		this.writeChannelClosed = false;
		// if own write and read channel are all closed
		this.allChannelClosed = false;

		// if stop write to buffer
		this.stopWriteToBuffer = false;

		this.sendKenelBufferFull = false;
		this.sendBufferArray = [];

		this.receiveMessageChunkQueue = new MessageChunkQueue();

		this.socket.setTimeout(HEART_BEAT_TIME, () => {
			this.logger.error(`Connection constructor, socket is idle for a long time, address: ${this.address ? this.address.toString("hex") : ""}, host: ${this.socket.remoteAddress}, port: ${this.socket.remotePort}, try to close it`);

			this.close();
		});

		this.socket.on("data", data => {
			if(!this.allChannelClosed)
			{
				this.receiveMessageChunkQueue.push(data);
				this.parse();
			}
		});

		this.socket.on("end", () => {
			this.logger.info(`Connection constructor, socket is closed by the other end, address: ${this.address ? this.address.toString("hex") : ""}, host: ${this.socket.remoteAddress}, port: ${this.socket.remotePort}, try to close it`);
			
			this.readChannelClosed = true;

			if(!this.writeChannelClosed)
			{
				this.close();
			}
		});

		this.socket.on("drain", () => {
			this.sendKenelBufferFull = false;
			this.flush();
		});

		this.socket.on("close", () => {
			this.logger.info(`Connection constructor, socket close, address: ${this.address ? this.address.toString("hex") : ""}, host: ${this.socket.remoteAddress}, port: ${this.socket.remotePort}, close success`);

			this.writeChannelClosed = true;
			this.readChannelClosed = true;
			this.allChannelClosed = true;

			this.emit("connectionClosed");
		});

		this.socket.on("error", e => {
			this.logger.error(`Connection constructor, socket throw error, address: ${this.address ? this.address.toString("hex") : ""}, host: ${this.socket.remoteAddress}, port: ${this.socket.remotePort}, ${e}`);
		});
	}

	async authorize()
	{
		this.write(AUTHORIZE_GET_NONCE_CMD);

		const promise = new Promise((resolve, reject) => {
			setTimeout(() => {
				reject(AUTHORIZE_FAILED_BECAUSE_OF_TIMEOUT);
			}, AUTHORIZE_DELAY_TIME).unref();

			this.on("authorizeSuccessed", () => {
				resolve();
			});

			this.on("authorizeFailed", () => {
				reject(AUTHORIZE_FAILED_BECAUSE_OF_INVALID_SIGNATURE);
			});
		});

		return promise;
	}

	close()
	{
		this.logger.info(`Connection close, try to close socket, address: ${this.address ? this.address.toString("hex") : ""}, host: ${this.socket.remoteAddress}, port: ${this.socket.remotePort}`)
		
		// stop new data write to buffer
		this.stopWriteToBuffer = true;

		if(this.socket && !this.socket.destroyed)
		{
			// try to flush all data
			this.flush();

			// wait specialized time for flush data from kenel to network
			setTimeout(() => {
				this.writeChannelClosed = true;
				this.socket.end();
			}, END_CLEAR_SEND_BUFFER_TIME_DEAY).unref()
		}
	}

	/**
	 * @return {Number} 1 show all data is pump to kenel buffer, 2 show part of the data is pump to kenel buffer
	 */
	flush()
	{
		// check if send kenel buffer is full
		if(this.sendKenelBufferFull || this.writeChannelClosed)
		{
			return 0;
		}

		while(this.sendBufferArray.length > 0)
		{
			const writeResult = this.socket.write(this.sendBufferArray[0]);

			this.sendBufferArray.splice(0, 1);

			// part or all of the data is queuing up at the system send buffer waiting to be pump to kenel buffer
			if(writeResult === false)
			{
				this.sendKenelBufferFull = true;
				
				return 2;
			}
		}

		return 1;
	}

	/**
	 * @param {Number} cmd
	 * @param {Buffer|Array|String|Number|BN} data
	 */
	write(cmd, data)
	{
		assert(typeof cmd === "number", `Connection write, cmd should be a Number, now is ${typeof cmd}`);

		if(this.stopWriteToBuffer)
		{
			return;
		}

		const msg = new Message({
			cmd: cmd,
			data: data || Buffer.alloc(0)
		});

		this.sendBufferArray.push(msg.serialize());
		
		this.flush();
	}

	parse()
	{
		let message;
		try
		{
			message = this.receiveMessageChunkQueue.getMessage();
		}
		catch(e)
		{
			this.logger.error(`Connection parse, receiveMessageChunkQueue.getMessage, ${e}`);

			// half close socket, socket will not write data, but will read data from socket
			this.close();
		}

		while(message)
		{
			const cmd = utils.bufferToInt(message.cmd);

			switch(cmd)
			{
				case AUTHORIZE_GET_NONCE_CMD:
				{
					this.write(AUTHORIZE_RETURN_NONCE_CMD, this.nonce);
				}
				break;

				case AUTHORIZE_RETURN_NONCE_CMD:
				{
					const privateKey = process[Symbol.for("privateKey")];
					const token = new Token({
						nonce: message.data
					});
					token.sign(privateKey);

					this.write(AUTHORIZE_BEGIN_CMD, token.serialize());
				}
				break;

				case AUTHORIZE_BEGIN_CMD:
				{
					const token = new Token(message.data);

					token.nonce = this.nonce;
					if(token.verifySignature())
					{
						this.address = token.address;
						this.write(AUTHORIZE_SUCCESS_CMD);

						this.emit("authorizeSuccessed");
					}
					else
					{
						this.write(AUTHORIZE_FAILED_CMD);

						this.emit("authorizeFailed");
					}
				}
				break;

				case AUTHORIZE_SUCCESS_CMD:
				{
					this.emit("authorizeSuccessed");
				}
				break;

				case AUTHORIZE_FAILED_CMD:
				{
					this.emit("authorizeFailed");
				}
				break;

				default: 
				{
					if(this.address)
					{
						this.dispatcher(message);
					}
				}
			}
			
			try
			{
				message = this.receiveMessageChunkQueue.getMessage();
			}
			catch(e)
			{
				this.logger.error(`Connection parse, receiveMessageChunkQueue.getMessage, ${e}`);

				// half close socket, socket will not write data, but will read data from socket
				this.close();
			}
		}
	}

	/**
	 * if the socket's write channel is open
	 * @return {Boolean}
	 */
	checkIfCanWrite()
	{
		return !this.stopWriteToBuffer;
	}

	/**
	 * if the socket is total closed
	 * @return {Boolean}
	 */
	checkIfClosed()
	{
		return this.allChannelClosed;
	}
}

module.exports = Connection;