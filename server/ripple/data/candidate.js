const Base = require("./base")
const util = require("../../../utils")
const Transaction = require("../../../transaction")
const {checkNodeAddress, getNodeNum} = require("../../nodes")

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
  validateSignatrue(stringError)
  {
    const errors = [];

    // verify
    if(!this.verifySignature())
    {
      errors.push("class Candidate validateSignatrue, Invalid Candidate Signature");
    }

    // check address
    if(!checkNodeAddress(this.from))
    {
    	errors.push("class Candidate validateSignatrue, Invalid node address");
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

  validateTransactions(stringError)
  {
    const errors = [];
    
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
  		this.push(new Transaction(transactions[i]));
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
      if(!transactions[transaction.hash(true)])
      {
        transactions[transaction.hash(true)] = {
          tx: transaction,
          num: 0
        };
      }
     
      transactions[transaction.hash(true)].num++;
    }

    // filter invalid transactions
    let invalidTransactions = [];
    let nodeNum = getNodeNum() + 1;
    for(hash in transactions)
    {
      if(transactions[hash].num / nodeNum < threshhold)
      {
        invalidTransactions.push(transactions[hash].tx);
      }
    }

    this.batchDel(invalidTransactions);
  }
}

module.exports = Candidate;