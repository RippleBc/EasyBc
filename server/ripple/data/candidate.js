const Base = require("./base")
const util = require("../../../utils")
const Transaction = require("../../../transaction")
const nodes = require("../../nodes")

const rlp = util.rlp;

class Candidate extends Base
{
	constructor(data)
	{
		super();

		data = data || {};

		// Define Properties
    const fields = [{
      name: "transactions",
      allowZero: true,
      default: util.Buffer.alloc(0)
    }, {
      name: "v",
      length: 1,
      allowZero: true,
      allowLess: true,
      default: util.Buffer.from([0x1c])
    }, {
      name: "r",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: util.Buffer.alloc(0)
    }, {
      name: "s",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: util.Buffer.alloc(0)
    }];

    /**
     * Returns the rlp encoding of the candidate
     * @method serialize
     * @memberof Transaction
     * @return {Buffer}
     */

    // attached serialize
    util.defineProperties(this, fields, data);
	}

  /**
   * Validates the signature
   * Checks candidate's property and signature
   * @param {Boolean} [stringError=false] whether to return a string with a description of why the validation failed or return a Boolean
   * @return {Boolean|String}
   */
  validate(stringError)
  {
    const errors = [];

    // verify
    if(!this.verifySignature())
    {
      errors.push("class Candidate validate, Invalid Candidate Signature");
    }

    // check address
    if(!nodes.checkNodeAddress(this.from))
    {
    	errors.push("class Candidate validate, Invalid Candidate address");
    }

  	// verify transactions
  	let rawTransactions = rlp.decode(this.transactions);
  	for(let i = 0; i < rawTransactions.length; i++)
  	{
  		let transaction = new Transaction(rawTransactions[i]);
  		if(!transaction.verifySignature())
  		{
  			errors.push(`class Candidate validate, Invalid Transaction Signature ${JSON.stringify(transaction.toJSON(true))}`);
  		}
  	}

    if(stringError === undefined || stringError === false)
    {
      return errors.length === 0;
    }
    else
    {
      return errors.join(" ");
    }
  }

  poolDataToCandidateTransactions()
  {
  	let transactions = [];
  	for(let i = 0; i < this.length; i++)
  	{
  		transactions.push(this.get(i).serialize())
  	}

  	this.transactions = rlp.encode(transactions);
  }

  candidateTransactionsToPoolData()
  {
  	let transactions = rlp.decode(this.transactions);
  	for(let i = 0; i < this.length; i++)
  	{
  		this.push(new Transaction(transactions[i]))
  	}
  }

  /**
   * @param {Number} threshhold
   */
  clearInvalidTransaction(threshhold)
  {
    let transactions = {};
    for(let i = 0; i < this.length; i++)
    {
      let transaction = this.data[i];
      if(!transactions[transaction.from])
      {
        transactions[transaction.from] = 1;
      }
      else
      {
        transactions[transaction.from] += 1;
      }
    }

    //
    let invalidTransactions = [];
    nodeNum = nodes.getNodeNum();
    for(key in transactions)
    {
      if(transactions[key] / nodeNum < threshhold)
      {
        invalidTransactions.push(key);
      }
    }

    //
    this.batchDel(invalidTransactions);
  }
}

module.exports = Candidate;