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

		this.closed = false;

		this.sendKenelBufferFull = false;
		this.sendBufferArray = [];

		this.receiveMessageChunkQueue = new MessageChunkQueue();

		const self = this;

		this.socket.setTimeout(HEART_BEAT_TIME, () => {
        self.socket.end();
    });

		this.socket.on("data", data => {
			if(!self.closed)
			{
				self.receiveMessageChunkQueue.push(data);
				self.parse();
			}
		});

		this.socket.on("end", () => {
			let timeout = setTimeout(() => {
				if(self.socket && !self.socket.destroyed)
				{
					self.socket.end();
				}
			}, END_CLEAR_SEND_BUFFER_TIME_DEAY);

			timeout.unref();
		});

		this.socket.on("drain", () => {
			self.sendKenelBufferFull = false;
			self.flush();
		});

		this.socket.on("close", () => {
			self.logger.trace(`Connection constructor, socket close, address: ${self.address ? self.address.toString("hex") : ""}, close success`);

			self.closed = true;
		});

		this.socket.on("error", e => {
			self.logger.error(`Connection constructor, socket throw error, address: ${self.address ? self.address.toString("hex") : ""}, ${e}`);
		});
	}

	async authorize()
	{
		this.write(AUTHORIZE_GET_NONCE_CMD);

		const self = this;
		const promise = new Promise((resolve, reject) => {
			self.on("authorizeSuccessed", () => {
				resolve();
			});

			self.on("authorizeFailed", () => {
				reject();
			});

			const timeOut = setTimeout(() => {
				reject();
			}, AUTHORIZE_DELAY_TIME);
			timeOut.unref();
		});

		return promise;
	}

	close()
	{
		this.socket.end();
	}

	flush()
	{
		// check if send kenel buffer is full
		if(this.sendKenelBufferFull)
		{
			return;
		}

		while(this.sendBufferArray.length > 0)
		{
			const writeResult = this.socket.write(this.sendBufferArray[0]);

			this.sendBufferArray.splice(0, 1);

			if(writeResult === false)
			{
				this.sendKenelBufferFull = true;
				break;
			}
		}
	}

	/**
	 * @param {Number} cmd
	 * @param {Buffer|Array|String|Number|BN} data
	 */
	write(cmd, data)
	{
		assert(typeof cmd === "number", `Connection write, cmd should be a Number, now is ${typeof cmd}`);

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
			this.socket.end();
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
						this.socket.end();

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
				this.socket.end();
			}
		}
	}
}

module.exports = Connection;