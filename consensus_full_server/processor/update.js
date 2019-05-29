const Block = require("../../depends/block");
const BlockChain = require("../../depends/block_chain");
const Transaction = require("../../depends/transaction");
const Trie = require("../../depends/trie");
const utils = require("../../depends/utils");
const rp = require("request-promise");
const { SUCCESS } = require("../../constant");
const { genesis } = require("../config.json");
const { TRANSACTIONS_CONSENSUS_THRESHOULD } = require('../constant');
const process = require("process");

let { unl } = require("../config.json");

const db = process[Symbol.for("db")];
const logger = process[Symbol.for("loggerUpdate")];
const mysql = process[Symbol.for("mysql")];

const BN = utils.BN;
const Buffer = utils.Buffer;
const padToEven = utils.padToEven;

const STATE_RUNNING = 1;
const STAGE_STATE_EMPTY = 0;


const GOD_PRIVATE_KEY = Buffer.from("d893eacfffa3ab4199c057a9e52587dad6cb8fc727e5678b92a2f58e7221710d", "hex");


class Update
{
	constructor()
	{
		this.blockChainHeight = undefined;
		this.blockChain = undefined;
		this.state = STAGE_STATE_EMPTY;
	}

	async run()
	{
		if(this.state === STATE_RUNNING)
		{
			return;
		}

		this.state = STATE_RUNNING;
		await this.init();
		await this.synchronize();
		this.state = STAGE_STATE_EMPTY;
	}

	async init()
	{
		const blockChain = new BlockChain({db: mysql});

		this.blockChainHeight = await blockChain.getBlockChainHeight();
		if(!this.blockChainHeight)
		{
			this.blockChainHeight = Buffer.alloc(0);

			this.blockChain = new BlockChain({
				db: mysql,
				trie: new Trie(db)
			});


			const transactions = [];
			for(let i = 0; i < genesis.length; i++)
			{
				let tx = new Transaction({
					nonce: 1,
					to: Buffer.from(genesis[i].address, 'hex'),
					value: Buffer.from(genesis[i].balance, 'hex')
				});
				tx.sign(GOD_PRIVATE_KEY);

				transactions.push(tx.serialize());
			}
			
			// init transactions
			const block = new Block({
				transactions: transactions
			});

			// init number
			block.header.number = 0;

			// init transactionTrie
			block.header.transactionsTrie = await block.genTxTrie();

			const result = await this.blockChain.runBlockChain({
				block: block,
				generate: true,
				skipNonce: true,
				skipBalance: true
			});
			if(result.state !== 0)
			{
				logger.fatal(`Update init, blockChain.runBlockChain, ${result.msg}`)

				process.exit(1);
			}

			return;
		}

		const lastestBlock = await blockChain.getBlockByNumber(this.blockChainHeight);
		if(!lastestBlock)
		{
			throw new Error(`Update init, blockChain.getBlockByNumber(${this.blockChainHeight.toString("hex")}) should not return undefined`);
		}

		this.blockChain = new BlockChain({
			db: mysql,
			trie: new Trie(db, lastestBlock.header.stateRoot)
		});
	}

	async synchronize()
	{
		let blockNumberBn = new BN(this.blockChainHeight).addn(1);
		while(true)
		{
			let blocks = new Map();

			for(let i = 0; i < unl.length; i++)
			{
				const node = unl[i];


				let options = {
					method: "POST",
					uri: `http://${node.host}:${node.queryPort}/getBlockByNumber`,
					body: {
						number: padToEven(blockNumberBn.toString(16))
					},
					json: true
				};

				let response;
				try
				{
					response = await rp(options);
					if(response.code !== SUCCESS)
					{
						logger.error(`Update synchronize, http request on host: ${node.host}, port: ${node.queryPort} failed, ${response.msg}`);
						continue;
					}
				}
				catch(e)
				{
					logger.error(`Update synchronize, http request on host: ${node.host}, port: ${node.queryPort} failed, ${e}`);
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
					logger.error(`Update synchronize, new Block failed, http request on host: ${node.host}, port: ${node.queryPort}, ${e}`);
					continue;
				}
			}

			const sortedBlocks = [...blocks].sort(ele => {
				return -ele[1];
			});
			if(sortedBlocks[0])
			{
				const [majorityBlock, count] = sortedBlocks[0];
				if(count / unl.length >= TRANSACTIONS_CONSENSUS_THRESHOULD)
				{
					const result = await this.blockChain.runBlockChain({
						block: new Block(Buffer.from(majorityBlock, 'hex'))
					});
					if(result.state !== 0)
					{
						logger.fatal('Update synchronize, runBlockChain failed, please clear the entrie database and synchronize again');

						process.exit(1);
					}


					blockNumberBn.iaddn(1);
				}
				else
				{
					break;
				}
			}
			else
			{
				break;
			}
		}
	}
}

module.exports = Update;