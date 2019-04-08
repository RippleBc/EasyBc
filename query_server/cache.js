const utils = require("../depends/utils");

const Buffer = utils.Buffer;
const toBuffer = utils.toBuffer;


class Cache
{
	constructor()
	{
		this.db = new Mysql();
		this.stateTrie = "";
		this.blockChainHeight = "";
	}

	async refresh()
	{	
		const newBlockChainHeight = await this.db.getBlockChainHeight();
		if(!newBlockChainHeight)
		{
			return;
		}

		if(this.blockChainHeight === newBlockChainHeight)
		{
			return;
		}

		this.blockChainHeight = newBlockChainHeight;
		const lastestBlock = await this.blockChain.getBlockByNumber(this.blockChainHeight);
		if(!lastestBlock)
		{
			throw new Error(`refresh, getBlockByNumber(${this.blockChainHeight.toString()}) should not return undefined`);
		}

		this.stateTrie = lastestBlock.header.stateTrie.toString("hex");
	}

	/**
	 * @param {String} address
	 */
	async getAccountInfo(address)
	{
		assert(typeof address === "string", `Cache getAccountInfo, address should be a String, now is ${typeof address}`);

		await this.refresh();

		return await this.db.getAccount(this.stateTrie, address);
	}

	/**
	 * @param {String} hash
	 */
	async getTransactionState(hash)
	{
		assert(typeof hash === "string", `Cache getTransactionState, hash should be a String, now is ${typeof hash}`);

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

		return this.db.getLastestBlock();
	}
}


module.exports = Cache;