const { assert, expect, should } = require("chai"); 
const utils = require("../depends/utils")
const Block = require("../depends/block")
const Transaction = require("../depends/transaction")
const Candidate = require("../consensus_full_server/ripple/data/candidate");
const RippleBlock = require("../consensus_full_server/ripple/data/rippleBlock");
const _ = require("underscore");

const Buffer = utils.Buffer;
const rlp = utils.rlp;
const sha256 = utils.sha256;
const bufferToInt = utils.bufferToInt;
const BN = utils.BN;

const FROM = Buffer.from("21d21b68ded27ce2ef619651d382892c1f77baa4", "hex")
const TO = Buffer.from("37faf6b0dd1c4faa396f975ffd350e25e8036bc7", "hex")
const PRIVATE_KEY = Buffer.from("7d4d01cae0cc51fcae5aff8b108e5fd6de5fdd024185f6569cd5c50f07deb493", "hex")

// init a transaction
const tx = new Transaction({
	from: FROM,
	to: TO,
	value: Buffer.from("10", "hex"),
	nonce: Buffer.from("01", "hex")
})
tx.sign(PRIVATE_KEY)
const transactionRaw = tx.serialize().toString("hex")

//
let candidateRaw;

//
describe("test transactions speed", () => {
	it("check pack transactions", done => {
		console.group();
		console.time("pack transactions, total")

		// init transactions
		let transactionRawArray = new Array(100).fill(transactionRaw)

		// transfer to Buffer
		console.time("pack transactions, transfer to Buffer")
		transactionRawArray = transactionRawArray.map(transactionRaw => {
			return Buffer.from(transactionRaw, "hex");
		})
		console.timeEnd("pack transactions, transfer to Buffer")

		// init candidate
		console.time("pack transactions, encode")
		const candidate = new Candidate({
			transactions: rlp.encode(transactionRawArray)
		});
		console.timeEnd("pack transactions, encode");

		// sign
		console.time("pack transactions, sign");
		candidate.sign(PRIVATE_KEY);
		console.timeEnd("pack transactions, sign");
		
		//
		console.time("pack transactions, serialize")
		candidateRaw = candidate.serialize().toString("hex")
		console.timeEnd("pack transactions, serialize")

		console.groupEnd();
		console.timeEnd("pack transactions, total")

		done();
	})

	it("check merge transactions", done => {
		console.log("\n\n")

		console.group();
		console.time("merge candidate, total")

		const candidateArray = new Array(5).fill(new Candidate(Buffer.from(candidateRaw, "hex")))

		const transactionRawsMap = new Map();
		candidateArray.forEach(candidate => {
			const rawTransactions = rlp.decode(candidate.transactions);

			rawTransactions.forEach(rawTransaction => {
				transactionRawsMap.set(rawTransaction.toString("hex"), rawTransaction);
			});
		});

		const transactionsRawArray = [...transactionRawsMap]

		console.groupEnd();
		console.timeEnd("merge candidate, total")

		done()
	})

	it("check vote candidate", done => {
		console.log("\n\n")

		// init transactions
		let transactionRawArray = new Array(500).fill(transactionRaw)

		// transfer to Buffer
		transactionRawArray = transactionRawArray.map(transactionRaw => {
			return Buffer.from(transactionRaw, "hex");
		})

		// init candidate
		const candidate = new Candidate({
			transactions: rlp.encode(transactionRawArray)
		});
		candidate.sign(PRIVATE_KEY);

		console.group();
		console.time("vote candidate, total")

		const candidateArray = new Array(5).fill(candidate)

		const transactionCollsHash = new Map();
		candidateArray.forEach(candidate => {
			console.time("vote candidate, sha256")
			const key = sha256(candidate.transactions).toString('hex');
			console.timeEnd("vote candidate, sha256")

			if(transactionCollsHash.has(key))
			{
				const count = transactionCollsHash.get(key).count;

				transactionCollsHash.set(key, {
					count: count + 1,
					data: candidate.transactions
				});
			}
			else
			{
				transactionCollsHash.set(key, {
					count: 1,
					data: candidate.transactions
				});
			}
		});

		//
		console.time("vote candidate, sort")
		const sortedTransactionColls = _.sortBy([...transactionCollsHash], transactionColl => -transactionColl[1].count);
		console.timeEnd("vote candidate, sort")

		// mixed all transactions, and begin to amalgamate
		console.time("vote candidate, mix all transactions")
		const transactionRawsMap = new Map();
		candidateArray.forEach(candidate => {
			console.group()
			console.time("vote candidate, mix all transactions, decode")
			const rawTransactions = rlp.decode(candidate.transactions);
			console.timeEnd("vote candidate, mix all transactions, decode")
			console.groupEnd()

			console.group()
			console.time("vote candidate, mix all transactions, mix")
			rawTransactions.forEach(rawTransaction => {
				transactionRawsMap.set(rawTransaction.toString("hex"), rawTransaction);
			});
			console.timeEnd("vote candidate, mix all transactions, mix")
			console.groupEnd()
		});
		console.timeEnd("vote candidate, mix all transactions")

		console.groupEnd();
		console.timeEnd("vote candidate, total")

		done()
	})

	it("check send block", done => {
		console.log("\n\n")

		// init transactions
		let transactionRawArray = new Array(500).fill(transactionRaw)

		// transfer to Buffer
		transactionRawArray = transactionRawArray.map(transactionRaw => {
			return Buffer.from(transactionRaw, "hex");
		});

		(async () => {
			console.group();
			console.time("check send block, total")

			// init block trasactions
			const block = new Block({
				transactions: transactionRawArray
			});

			// init timestamp
			console.time("check send block, init timestamp")
			let timestamp = 0;
			for(let i = 0; i < block.transactions.length; i++)
			{
				let transaction = block.transactions[i];

				if(bufferToInt(transaction.timestamp) > timestamp)
				{
					timestamp = bufferToInt(transaction.timestamp)
				}
			}
			block.header.timestamp = timestamp;
			console.timeEnd("check send block, init timestamp")

			// init height
			const height = Buffer.from("10", "hex")
			
			block.header.number = (new BN(height).addn(1)).toArrayLike(Buffer);
			const parentHash = Buffer.from("96f7e6cd9b09ccf3c6c8acf520fec5839a8f480bdce81f4bfe157a9f58689f16", "hex")

			// init txTrie
			console.time("check send block, block genTxTrie")
			block.header.parentHash = parentHash;
			block.header.transactionsTrie = await block.genTxTrie();
			console.timeEnd("check send block, block genTxTrie");

			console.time("check send block, init rippleBlock");
			const rippleBlock = new RippleBlock({
				block: block.serialize()
			});
			console.timeEnd("check send block, init rippleBlock");

			console.time("check send block, rippleBlock sign");
			rippleBlock.sign(PRIVATE_KEY);
			console.timeEnd("check send block, rippleBlock sign");

			const rippleBlockRaw = rippleBlock.serialize();

			console.groupEnd();
			console.timeEnd("check send block, total");
		})().then(() => {
			done()
		}).catch(e => {
			done(e)
		})
	})
})