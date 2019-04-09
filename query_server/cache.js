const utils = require("../depends/utils");
const Mysql = require("./mysql");
const assert = require("assert");

const Buffer = utils.Buffer;
const toBuffer = utils.toBuffer;


class Cache
{
	constructor()
	{
		this.db = new Mysql();
		this.stateRoot = "";
		this.number = "";
		this.block = undefined;
		this.blockChainHeight = "";
	}

	async refresh()
	{	
		const newBlockChainHeight = await this.db.getBlockChainHeight();
		if(newBlockChainHeight === undefined)
		{
			return;
		}

		if(this.blockChainHeight === newBlockChainHeight)
		{
			return;
		}

		this.blockChainHeight = newBlockChainHeight;
		this.block = await this.db.getBlockByNumber(this.blockChainHeight);
		if(!this.block)
		{
			throw new Error(`refresh, getBlockByNumber(${this.blockChainHeight.toString()}) should not return undefined`);
		}

		this.stateRoot = this.block.header.stateRoot.toString("hex");
		this.number = this.block.header.number.toString("hex");
	}

	/**
	 * @param {String} address
	 */
	async getAccount(address)
	{
		assert(typeof address === "string", `Cache getAccountInfo, address should be a String, now is ${typeof address}`);

		await this.refresh();

		return await this.db.getAccount(this.number, this.stateRoot, address);
	}

	/**
	 * @param {String} hash
	 */
	async getTrasaction(hash)
	{
		assert(typeof hash === "string", `Cache getTrasaction, hash should be a String, now is ${typeof hash}`);

		await this.refresh();

		return this.db.getTransaction(hash);
	}

	/**
	 * @param {String} hash
	 */
	async getBlockByNumber(number)
	{
		assert(typeof number === "string", `Cache getBlockByNumber, number should be a String, now is ${typeof number}`);

		await this.refresh();

		return await this.db.getBlockByNumber(number);
	}

	async getLastestBlock()
	{
		await this.refresh();

		return this.block;
	}
}


module.exports = Cache;