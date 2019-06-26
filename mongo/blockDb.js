const blockSchema = require("./block")
const assert = require("assert");
const Block = require("../depends/block")

class BlockDb
{
  constructor(mongooseInstance)
  {
    this.Block = mongooseInstance.model('Block', blockSchema);
  }

  /**
   * @param {Buffer} number
   * @return {Buffer}
   */
  async getBlockHashByNumber(number)
  {
    assert(Buffer.isBuffer(number), `BlockDb getBlockHashByNumber, number should be an Buffer, now is ${typeof number}`);

    const promise = new Promise((resolve, reject) => {
      this.Block.findOne({
        number: number.toString('hex')
      }, 
      'hash', 
      { 
        lean: true 
      }, 
      (err, result) => {
        if(!!err)
        {
          reject(`Mongo getBlockHashByNumber, throw exception, ${err}`)
        }

        if(result)
        {
          resolve(Buffer.from(result.hash, "hex"))
        }
        else
        {
          resolve()
        }
      });
    });

    return promise;
  }

  /*
   * @return {Buffer}
   */
  async getBlockChainHeight()
  {
    const promise = new Promise((resolve, reject) => {
      this.Block.findOne({
        
      }, 
      'number', 
      {
        lean: true,
        sort: {
          number: -1
        },
        limit: 1
      },
      (err, result) => {
        if(!!err)
        {
          reject(`Mongo getBlockChainHeight, throw exception, ${err}`)
        }

        if(result)
        {
          resolve(Buffer.from(result.number, "hex"))
        }
        else
        {
          resolve()
        }
      });
    });

    return promise;
  }

  /**
   * @param {Buffer} hash
   * @return {Block}
   */
  async getBlockByHash(hash)
  {
    assert(Buffer.isBuffer(hash), `BlockDb getBlockByHash, hash should be an Buffer, now is ${typeof hash}`);

    const promise = new Promise((resolve, reject) => {
      this.Block.findOne({
        hash: hash.toString('hex')
      }, 
      'data', 
      { 
        lean: true 
      }, 
      (err, result) => {
        if(!!err)
        {
          reject(`Mongo getBlockHashByNumber, throw exception, ${err}`)
        }

        if(result)
        {
          resolve(Buffer.from(result.data, "hex"))
        }
        else
        {
          resolve()
        }
      });
    });

    return promise;
  }

  /**
   * @param {Buffer} number
   * @return {Block}
   */
  async getBlockByNumber(number)
  {
    assert(Buffer.isBuffer(number), `BlockDb getBlockByNumber, number should be an Buffer, now is ${typeof number}`);

    const promise = new Promise((resolve, reject) => {
     this.Block.findOne({
        number: number.toString('hex')
      }, 
      'data', 
      { 
        lean: true 
      }, 
      (err, result) => {
        if(!!err)
        {
          reject(`Mongo getBlockHashByNumber, throw exception, ${err}`)
        }

        if(result)
        {
          resolve(Buffer.from(result.data, "hex"))
        }
        else
        {
          resolve()
        }
      });
    });

    return promise;
  }

  /**
   * @param {Block} block
   */
  async saveBlock(block)
  {
    assert(block instanceof Block, `BlockDb saveBlock, block should be an Block Object, now is ${typeof block}`);

    await this.Block.create({
      number: block.header.number.toString('hex'),
      hash: block.hash().toString('hex'),
      data: block.serialize().toString('hex')
    })
  }
}

module.exports = BlockDb;