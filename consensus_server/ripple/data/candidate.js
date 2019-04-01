const process = require("process");
const Base = require("./base");
const util = require("../../../depends/utils");
const Transaction = require("../../../depends/transaction");

const logger = process[Symbol.for("loggerConsensus")];

const rlp = util.rlp;

class Candidate extends Base
{
	constructor(data)
	{
		super();

		data = data || {};

    const fields = [{
      name: "transactions",
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

    util.defineProperties(this, fields, data);
	}

  /**
   * Validates the signature
   * Checks candidate's property and signature
   * @return {String}
   */
  validate()
  {
    const errors = [];

    // verify signature
    if(!this.verifySignature())
    {
      logger.error("Candidate validate, invalid signature");

      return false;
    }

    // check address
    if(!this.checkAddress(this.from))
    {
      logger.error("Candidate validate, invalid address");

      return false;
    }

    // verify transactions
    try
    {
      const transactionRawsArray = rlp.decode(this.transactions);
      for(let i = 0; i < transactionRawsArray.length; i++)
      {
        const transaction = new Transaction(transactionRawsArray[i]);
        const { state, msg } = transaction.validate()
        if(!state)
        {
          logger.error(`Candidate validate, invalid transaction, ${msg}`);

          return false;
        }
      } 
    }
    catch(e)
    {
      logger.error(`Candidate validate, check transactions failed, ${e}`);

      return false;
    }

    return true;
  }
}

module.exports = Candidate;