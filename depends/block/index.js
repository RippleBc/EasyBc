const utils = require("../utils");
const Transaction = require("../transaction");
const Trie = require("../trie");
const Header = require("./header");
const assert = require("assert");

const Buffer = utils.Buffer;
const BN = utils.BN;
const rlp = utils.rlp;
const toBuffer = utils.toBuffer;

class Block 
{
  constructor(data)
  {
    data = data || [[], []];

    this.txTrie = new Trie();

    // decode
    if(typeof data === "string" && utils.isHexString(data))
    {
      data = toBuffer(data);
    }
    if(Buffer.isBuffer(data))
    {
      data = rlp.decode(data);
    }

    // init header and transactions
    let rawTransactions;
    if(Array.isArray(data))
    {
      this.header = new Header(data[0]);
      rawTransactions = data[1];
    }
    else if(typeof data === "object")
    {
      this.header = new Header(data.header);
      rawTransactions = data.transactions;
    }
    else
    {
      throw Error(`Block constructor, data which has been parsed should be an Array or Object, now is ${typeof data}`);
    }
    this.header.blockClass = Block;
    if(Buffer.isBuffer(rawTransactions))
    {
      rawTransactions = rlp.decode(rawTransactions);
    }
    assert(Array.isArray(rawTransactions), `rawTransactions should be an Array, now is ${typeof rawTransactions}`);
    this.transactions = [];
    for(let i = 0; i < rawTransactions.length; i++)
    {
      this.transactions.push(new Transaction(rawTransactions[i]));
    }
  }


  /**
   * Produces a hash the RLP of the block
   * @return {Boolean}
   */
  hash()
  {
    return this.header.hash();
  }

  /**
   * Determines if a given block is the genesis block
   * @return {Boolean}
   */
  isGenesis()
  {
    return this.header.isGenesis()
  }

  /**
   * Produces a serialization of the block.
   * @return {Buffer}
   */
  serialize()
  {
    const raw = [this.header.raw, []];

    for(let i = 0; i < this.transactions.length; i++)
    {
      raw[1].push(this.transactions[i].raw);
    }

    return rlp.encode(raw);
  }

  /**
   * Generate transaction trie. The tx trie must be generated before the transaction trie can be validated with `validateTransactionTrie`
   */
  async genTxTrie()
  {
    for(let i = 0 ; i < this.transactions.length; i++)
    {
      let transaction = this.transactions[i];

      await this.txTrie.put(transaction.hash(true), transaction.serialize());
    };

    return this.txTrie.root;
  }

  /**
   * Validates the transaction trie
   * @return {Boolean}
   */
  validateTransactionsTrie()
  {
    return this.header.transactionsTrie.toString("hex") === this.txTrie.root.toString("hex");
  }

  /**
   * Validates the transactions
   * @return {Object}
   * @prop {Boolean} state - if transactions are valid
   * @prop {String} msg - failed info.
   */
  validateTransactions()
  {
    const errors = [];

    this.transactions.forEach(function(transaction, index) {
      const {state, msg} = transaction.validate();
      if(!state)
      {
        errors.push(`index: ${index}, err: ${msg}`);
      }
    });

    return {
      state: errors.length ? false : true,
      msg: `validateTransactions failed, ${errors.join(", ")}`
    }
  }

  /**
   * Validates the entire block
   * @return {Object}
   * @prop {Boolean} state - if block is valid
   * @prop {String} msg - failed info.
   */
  async validate(parentBlock)
  {
    assert(parentBlock instanceof Block || parentBlock === undefined, `Block validate, parentBlock should be an BLock or undefined, now is ${typeof parentBlock}`);

    const errors = [];

    // generate the transaction trie
    try
    {
      await this.genTxTrie();
    }
    catch(e)
    {
      errors.push(`genTxTrie is failed, ${e}`);
    }
    
    try
    {
      // check header
      const headerValidateResult = this.header.validate(parentBlock);
      if(!headerValidateResult.state)
      {
        errors.push(headerValidateResult.msg);
      }
    }
    catch(e)
    {
      await Promise.reject(`block validate failed, header.validate throw exception, ${e}`);
    }

    // check transactions trie
    if(!this.validateTransactionsTrie())
    {
      errors.push("invalid transactions trie");
    }

    // check transactions
    let {state, msg} = this.validateTransactions();
    if(!state)
    {
      errors.push(msg);
    }

    return {
      state: errors.length ? false : true,
      msg: `block validate failed, ${errors.join(", ")}`
    };
  }

  /**
   * @param {Buffer} transactionHash
   * @return {Transaction} 
   */
  getTransaction(transactionHash)
  {
    assert(Buffer.isBuffer(transactionHash), `transactionHash should be an Buffer, now is ${typeof transactionHash}`);

    for(let i = 0; i < this.transactions.length; i++)
    {
      if(this.transactions[i].hash(true).toString("hex") === transactionHash.toString("hex"))
      {
        return this.transactions[i];
      }
    }

    return undefined;
  }

  /**
   * @param {Array} transactions
   */
  delInvalidTransactions(transactions)
  {
    assert(Array.isArray(transactions), `transactions should be an Array, now is ${typeof transactions}`);

    let i, j;
    for(i = 0; i < transactions.length; i++)
    {
      for(j = 0; j < this.transactions.length; j++)
      {
        if(transactions[i].hash(true).toString("hex") === this.transactions[j].hash(true).toString("hex"))
        {
          this.transactions.splice(j, 1);
        }
      }
    }
  }
}

module.exports = Block;