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
const { AUTHORIZE_FAILED_BECAUSE_OF_TIMEOUT, AUTHORIZE_FAILED_BECAUSE_OF_OTHER_INVALID_SIGNATURE, AUTHORIZE_FAILED_BECAUSE_OF_SELF_INVALID_SIGNATURE } = require("../constant");

const Buffer = utils.Buffer;

const END_CLEAR_SEND_BUFFER_TIME_DEAY = 1000 * 5;
const HEART_BEAT_TIME = 1000 * 10;
const AUTHORIZE_DELAY_TIME = 5000;

const AUTHORIZE_REQ_CMD = 1;
const AUTHORIZE_RES_CMD = 2;
const AUTHORIZE_SUCCESS_CMD = 3;
const AUTHORIZE_FAILED_CMD = 4;

class Connection extends AsyncEventEmitter
{
	constructor(opts)
	{
		super();

		assert(opts.socket instanceof Socket, `Connection	constructor, opts.socket should be a Socket Object, now is ${typeof opts.socket}`);
		assert(typeof opts.dispatcher	=== "function", `Connection	constructor, opts.dispatcher should be a Function, now is ${typeof opts.dispatcher}`);
		assert(typeof opts.logger	=== "object", `Connection	constructor, opts.logger should be an Object, now is ${typeof opts.logger}`);

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

		// if authrozed over
		this.ifAuthorizeSuccess = false;

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

		this.socket.on("close", had_error => {
			this.logger.info(`Connection constructor, socket close because of ${ had_error ? 'transmit error' : 'other reason' }, address: ${this.address ? this.address.toString("hex") : ""}, host: ${this.socket.remoteAddress}, port: ${this.socket.remotePort}, close success`);

			this.writeChannelClosed = true;
			this.readChannelClosed = true;
			this.allChannelClosed = true;

			this.emit("connectionClosed");
		});

		this.socket.on("error", e => {
			this.logger.error(`Connection constructor, socket throw error, address: ${this.address ? this.address.toString("hex") : ""}, host: ${this.socket.remoteAddress}, port: ${this.socket.remotePort}, ${process[Symbol.for("getStackInfo")](e)}`);
		});
	}

	async authorize()
	{
		this.write(AUTHORIZE_REQ_CMD, this.nonce);

		let meTrustOther = false;
		let otherTrustMe = false;

		const promise = new Promise((resolve, reject) => {
			setTimeout(() => {
				reject(AUTHORIZE_FAILED_BECAUSE_OF_TIMEOUT);
			}, AUTHORIZE_DELAY_TIME).unref();

			

			this.once("meTrustOther", () => {
				meTrustOther = true;

				if (otherTrustMe)
				{
					this.ifAuthorizeSuccess = true;

					resolve();
				}
			});

			this.once("otherTrustMe", () => {
				otherTrustMe = true;

				if (meTrustOther) {
					this.ifAuthorizeSuccess = true;

					resolve();
				}
			});

			this.once("meDoNotTrustOther", () => {
				reject(AUTHORIZE_FAILED_BECAUSE_OF_OTHER_INVALID_SIGNATURE);
			});

			this.once("otherDoNotTrustMe", () => {
				reject(AUTHORIZE_FAILED_BECAUSE_OF_SELF_INVALID_SIGNATURE);
			})

		});

		return promise;
	}

	close()
	{
		this.logger.info(`Connection close, try to close socket, address: ${this.address ? this.address.toString("hex") : ""}, host: ${this.socket.remoteAddress}, port: ${this.socket.remotePort}`)
		
		// stop new data write to buffer
		this.stopWriteToBuffer = true;

		if(this.allChannelClosed)
		{
			return this.logger.error(`Connection close, repeat close socket, address: ${this.address ? this.address.toString("hex") : ""}, host: ${this.socket.remoteAddress}, port: ${this.socket.remotePort}, ${process[Symbol.for("getStackInfo")]()}`)
		}
	
		// wait specialized time for flush data from system to kernel
		const closeTimeout = setTimeout(() => {
			// try to close socket
			if (!this.writeChannelClosed)
			{
				this.writeChannelClosed = true;
				this.socket.end();
			}
		}, END_CLEAR_SEND_BUFFER_TIME_DEAY);
		closeTimeout.unref();

		// try to flush all data
		(async () => {
			// flush data
			let flushResultCode = this.flush();
			while (flushResultCode === 2 || flushResultCode === 3)
			{
				await new Promise((resolve, reject) => {
					setTimeout(() => {
						resolve();
					});
				})

				flushResultCode = this.flush();
			}
		})().catch(e => {
			this.logger.error(`Connection close, flush throw exception, ${process[Symbol.for("getStackInfo")](e)}`);
		}).finally(() => {
			// try to clear close timeout
			clearTimeout(closeTimeout)

			// try to close socket
			if (!this.writeChannelClosed) 
			{
				this.writeChannelClosed = true;
				this.socket.end();
			}
		})
	}

	/**
	 * @return {Number} 0 show sendKenelBufferIs full1 show all data is pump to kernel buffer, 3 
	 */
	flush()
	{
		// write channel has closed
		if (this.writeChannelClosed) 
		{
			return 1;
		}

		// check if send kernel buffer is full
		if(this.sendKenelBufferFull)
		{
			return 2;
		}

		while(this.sendBufferArray.length > 0)
		{
			// 如果全部数据都成功刷新到内核的缓冲则返回true。如果全部或部分数据在用户内中排队，则返回false。
			const writeResult = this.socket.write(this.sendBufferArray[0]);

			this.sendBufferArray.splice(0, 1);

			// part or all of the data is queuing up at the system send buffer waiting to be pump to kernel buffer
			if(writeResult === false)
			{
				this.sendKenelBufferFull = true;
				
				return 3;
			}
		}

		// all data has send to kernel buffer
		return 4;
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
			this.logger.error(`Connection parse, receiveMessageChunkQueue.getMessage, ${process[Symbol.for("getStackInfo")](e)}`);

			// half close socket, socket will not write data, but will read data from socket
			this.close();
		}

		while(message)
		{
			const cmd = utils.bufferToInt(message.cmd);

			switch(cmd)
			{
				case AUTHORIZE_REQ_CMD:
				{
					const privateKey = process[Symbol.for("privateKey")];

					let token;
					try
					{
						token = new Token({
							nonce: message.data
						});
					}
					catch(e)
					{
						this.write(AUTHORIZE_FAILED_CMD);

						this.emit("meDoNotTrustOther");

						this.logger.error(`Connection parse, invalid token data, ${process[Symbol.for("getStackInfo")](e)}`)

						return;
					}
				
					token.sign(privateKey);

					this.write(AUTHORIZE_RES_CMD, token.serialize());
				}
				break;

				case AUTHORIZE_RES_CMD:
				{
					let token;
					try {
						token = new Token(message.data);
					} 
					catch (e) 
					{
						this.write(AUTHORIZE_FAILED_CMD);

						this.emit("meDoNotTrustOther");

						this.logger.error(`Connection parse, invalid token data, ${process[Symbol.for("getStackInfo")](e)}`)

						return;
					}
					

					token.nonce = this.nonce;
					if (token.verifySignature()) {
						this.address = token.address;
						this.write(AUTHORIZE_SUCCESS_CMD);

						this.emit("meTrustOther");
					}
					else {
						this.write(AUTHORIZE_FAILED_CMD);

						this.emit("meDoNotTrustOther");
					}
				}
				break;

				case AUTHORIZE_SUCCESS_CMD:
				{
					this.emit("otherTrustMe");
				}
				break;

				case AUTHORIZE_FAILED_CMD:
				{
					this.emit("otherDoNotTrustMe");
				}
				break;

				default: 
				{
					if (this.ifAuthorizeSuccess)
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
				this.logger.error(`Connection parse, receiveMessageChunkQueue.getMessage, ${process[Symbol.for("getStackInfo")](e)}`);

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