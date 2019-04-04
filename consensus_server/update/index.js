const Block = require("../../depends/block");
const BlockChain = require("../../depends/block_chain");
const Trie = require("../../depends/trie");
const utils = require("../../depends/utils");
const rp = require("request-promise");
const { SUCCESS } = require("../../constant");
const { unl } = require("./config.json");
const process = require("process");

const db = process[Symbol.for("db")];
const logger = process[Symbol.for("loggerUpdate")];

const BN = utils.BN;
const toBuffer = utils.toBuffer;
const Buffer = utils.Buffer;

const STATE_RUNNING = 1;
const STATE_EMPTY = 0;

class Update
{
	constructor()
	{
		this.blockChainHeight = undefined;
		this.blockChain = undefined;
		this.state = STATE_EMPTY;
	}

	async run()
	{
		if(this.state = STATE_RUNNING)
		{
			return;
		}

		this.state = STATE_RUNNING;
		await this.initBlockChain();
		await this.update();
		this.state = STATE_EMPTY;
	}

	async initBlockChain()
	{
		const blockChain = new BlockChain({db: db});

		this.blockChainHeight = await blockChain.getBlockChainHeight();
		if(!this.blockChainHeight)
		{
			this.blockChainHeight = Buffer.alloc(0);

			this.blockChain = new BlockChain({
				db: db,
				trie: new Trie(db)
			});
			return;
		}

		const lastestBlock = await blockChain.getBlockByNumber(this.blockChainHeight);
		if(!lastestBlock)
		{
			throw new Error(`Update initBlockChain, blockChain.getBlockByNumber(${this.blockChainHeight.toString("hex")}) should not return undefined`);
		}

		this.blockChain = new BlockChain({
			db: db,
			trie: new Trie(db, lastestBlock.header.stateRoot)
		});
	}

	async update()
	{
		const options = {
			method: "POST",
			uri: "",
			body: {
				number: ""
			},
			json: true // Automatically stringifies the body to JSON
		};

		let blockNumberBn = new BN(this.blockChainHeight).addn(1);
		while(true)
		{
			let blocks = new Map();

			for(let i = 0; i < unl.length; i++)
			{
				const node = unl[i];

				options.uri = `http://${node.host}:${node.port}`;
				options.body.number = blockNumberBn.toString(16);

				let response;
				try
				{
					response = await rp(options);
					if(response.code !== SUCCESS)
					{
						logger.error(`Update update, http request on host: ${node.host}, port: ${node.port} failed, ${response.msg}`);
						continue;
					}
				}
				catch(e)
				{
					logger.error(`Update update, http request on host: ${node.host}, port: ${node.port} failed, ${e}`);
					continue;
				}

				try
				{
					if(blocks.has(response.data))
					{
						const count = blocks.get(response.data);
						
						blocks.set(response.data, count + 1);
					}
					else
					{
						blocks.set(response.data, 1);
					}
				}
				catch(e)
				{
					logger.error(`Update update, new Block failed, http request on host: ${node.host}, port: ${node.port}, ${e}`);
					continue;
				}
			}

			const sortedBlocks = [...blocks].sort(ele => {
				return -ele[0];
			});
			const majorityBlock = sortedBlocks[0];
			if(majorityBlock)
			{
				await this.blockChain.runBlockChain({
					block: majorityBlock
				});
				blockNumberBn.iaddn(1);
			}
			else
			{
				break;
			}
		}
	}
}

module.exports = Update;