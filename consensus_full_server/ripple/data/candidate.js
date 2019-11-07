const Base = require("./base");
const utils = require("../../../depends/utils");
const Transaction = require("../../../depends/transaction");

const logger = process[Symbol.for("loggerConsensus")];

const rlp = utils.rlp;
const Buffer = utils.Buffer;

class Candidate extends Base
{
	constructor(data)
	{
		super({ name: 'candidate' });

		data = data || {};

    const fields = [{
      name: "hash",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "number",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "timestamp",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "view",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "transactions",
      allowZero: true,
      default: Buffer.alloc(0)
    }, {
      name: "v",
      length: 1,
      allowZero: true,
      allowLess: true,
      default: Buffer.from([0x1c])
    }, {
      name: "r",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }, {
      name: "s",
      length: 32,
      allowZero: true,
      allowLess: true,
      default: Buffer.alloc(0)
    }];

    utils.defineProperties(this, fields, data);
	}

  /**
   * Validates the signature
   * Checks candidate's property and signature
   * @return {String}
   */
  validate()
  {
    if(!super.validate())
    {
      return false;
    }

    // verify transactions
    try
    {
      const transactionRawsArray = rlp.decode(this.transactions);
      for(let i = 0; i < transactionRawsArray.length; i++)
      {
        const transaction = new Transaction(transactionRawsArray[i]);
        const { state, msg } = transaction.validate();
        if(!state)
        {
          logger.error(`Candidate validate, invalid transaction, ${msg}`);

          return false;
        }
      } 
    }
    catch(e)
    {
      logger.error(`Candidate validate, check transactions failed, ${process[Symbol.for("getStackInfo")](e)}`);

      return false;
    }

    return true;
  }
}

module.exports = Candidate;