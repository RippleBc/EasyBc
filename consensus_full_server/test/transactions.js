const { assert, expect, should } = require("chai"); 
const utils = require("../../depends/utils")
const Transaction = require("../../depends/transaction")
const Candidate = require("../ripple/data/candidate");

const Buffer = utils.Buffer;
const rlp = utils.rlp;

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
		console.time("pack transactions")

		// init transactions
		let transactionRawSet = new Array(100).fill(transactionRaw)

		// transfer to Buffer
		transactionRawSet = transactionRawSet.map(transactionRaw => {
			return Buffer.from(transactionRaw, "hex");
		})
		
		console.time("pack transactions, encode")
		// init candidate
		const candidate = new Candidate({
			transactions: rlp.encode(transactionRawSet)
		});
		candidate.sign(PRIVATE_KEY);
		
		console.timeEnd("pack transactions, encode")

		candidateRaw = candidate.serialize().toString("hex")

		console.timeEnd("pack transactions")

		done();
	})

	it("check merge candidate", done => {
		console.time("merge candidate")

		const candidateSet = new Array(5).fill(new Candidate(Buffer.from(candidateRaw, "hex")))

		const transactionRawsMap = new Map();
		candidateSet.forEach(candidate => {
			const rawTransactions = rlp.decode(candidate.transactions);

			rawTransactions.forEach(rawTransaction => {
				transactionRawsMap.set(rawTransaction.toString("hex"), rawTransaction);
			});
		});

		console.timeEnd("merge candidate")

		done()
	})
})