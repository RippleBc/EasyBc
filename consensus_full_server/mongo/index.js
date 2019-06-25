const mongoose = require('mongoose');
const blockSchema = require("./block")
const trieNodeSchema = require("./trieNode")
const mongoConfig = require("../config.json").mongo;
const MptDB = require("../../depends/merkle_patricia_tree/db")
const assert = require("assert");
const Block = require("../../depends/block")

class Mongo
{
	constructor()
	{
    
	}

  async init()
  {
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);

    const blockChainDb = await mongoose.connect(`mongodb://${mongoConfig.host}:${mongoConfig.port}`, {
      dbName: "blockChain", 
      user: mongoConfig.user,
      pass: mongoConfig.password
    });

    this.Block = blockChainDb.model('Block', blockSchema);
    this.TrieNode = blockChainDb.model('TrieNode', trieNodeSchema);
  }

  /**
   * @param {Buffer} key
   * @param {Function} cb
   */
  get(key, options, cb)
  {
    TrieNode.findOne({
      hash: key.toString("hex")
    },
    'data',
    {
      lean: true
    }, (err, result) => {
      if(!!err)
      {
        return cb(`Mongo get, throw exception ${e}`)
      }

      if(result)
      {
        return cb(null, Buffer.from(result.data, "hex"));
      }
      
      cb(`Mongo get, key ${key.toString('hex')} has no corresponding value}`);
    })
  }

  /**
   * @param {Buffer} key
   * @param {Buffer} val
   * @param {Function} cb
   */
  put(key, val, options, cb)
  {
    TrieNode.create({
      hash: key.toString("hex"),
      data: val.toString("hex")
    }).then(() => {
      cb()
    }).catch(e => {
      cb(`Mongo put, throw exception ${e}`)
    })
  }

  /**
   * @param {Buffer} key
   * @param {Function} cb
   */
  del(key, options, cb)
  {
    TrieNode.remove({
      hash: key.toString("hex")
    }, e => {
      if(!!e)
      {
        return cb(`Mongo del, trhow exception ${e}`)
      }

      cb()
    }) 
  }

  /**
   * @param {Array} opStack
   * @param {Function} cb
   */
  batch(opStack, options, cb)
  {
    opStack = opStack.map(op => {
      return {
        hash: op.key.toString("hex"),
        data: op.value.toString("hex")
      }
    });

    this.TrieNode.create(opStack).then(() => {
      cb()
    }).catch(e => {
      cb(e)
    })
  }

  /**
   * @param {Buffer} number
   * @return {Buffer}
   */
  async getBlockHashByNumber(number)
  {
    assert(Buffer.isBuffer(number), `Mysql getBlockHashByNumber, number should be an Buffer, now is ${typeof number}`);

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
    assert(Buffer.isBuffer(hash), `Mysql getBlockByHash, hash should be an Buffer, now is ${typeof hash}`);

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
    assert(Buffer.isBuffer(number), `Mysql getBlockByNumber, number should be an Buffer, now is ${typeof number}`);

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
    assert(block instanceof Block, `Mysql saveBlock, block should be an Block Object, now is ${typeof block}`);

    await this.Block.create({
      number: block.header.number.toString('hex'),
      hash: block.hash().toString('hex'),
      data: block.serialize().toString('hex')
    })
  }
}

module.exports = async () => {
  const mongo = new Mongo()

  await mongo.init()

  return new MptDB(mongo);
}