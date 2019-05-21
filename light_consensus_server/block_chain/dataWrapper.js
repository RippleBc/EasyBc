const process =require('process');
const assert = require("assert");

const mysql = process[Symbol.for("mysql")];

class DataWrapper
{
	constructor()
	{
		this.stateRoot = "";
		this.number = "";
		this.block = undefined;
		this.blockChainHeight = undefined;
	}

	async refresh()
	{	
		const newBlockChainHeight = await mysql.getBlockChainHeight();
		if(newBlockChainHeight === undefined)
		{
			return;
		}

		if(this.blockChainHeight === newBlockChainHeight)
		{
			return;
		}

		this.blockChainHeight = newBlockChainHeight;
		this.block = await mysql.getBlockByNumber(this.blockChainHeight);
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
		assert(typeof address === "string", `Block getAccountInfo, address should be a String, now is ${typeof address}`);

		await this.refresh();

		return await mysql.getAccount(this.number, this.stateRoot, address);
	}

	/**
	 * @param {String} hash
	 */
	async getTrasaction(hash)
	{
		assert(typeof hash === "string", `Block getTrasaction, hash should be a String, now is ${typeof hash}`);

		return mysql.getTransaction(hash);
	}

	async getTransactions({hash, from, to, beginTime, endTime})
	{
		return mysql.getTransactions({hash, from, to, beginTime, endTime});
	}

	/**
	 * @param {String} hash
	 */
	async getBlockByNumber(number)
	{
		assert(typeof number === "string", `Block getBlockByNumber, number should be a String, now is ${typeof number}`);

		return await mysql.getBlockByNumber(Buffer.from(number, 'hex'));
	}

	async getLastestBlock()
	{
		await this.refresh();

		return this.block;
	}
}

module.exports = new DataWrapper();