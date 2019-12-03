const { SUCCESS, PARAM_ERR, OTH_ERR } = require('../../constant')
const Block = require("../../depends/block");
const rp = require("request-promise");
const assert = require("assert");
const utils = require("../../depends/utils");

const BN = utils.BN;
const Buffer = utils.Buffer;
const padToEven = utils.padToEven;

class BlockCache
{

  constructor()
  {
    
  }

  /**
   * @param {String} url
   * @param {Number} blocksNum 
   */
  async getBlockChainInfo(url, blocksNum)
  {
    assert(typeof url === 'string', `BlockCache getBlockChainInfo, url should be a String, now is ${typeof url}`)
    assert(typeof blocksNum === 'number', `BlockCache getBlockChainInfo, blocksNum should be a Number, now is ${typeof blocksNum}`);

    const blocks = [];

    const lastestBlockRaw = await getLastestBlock(url);
    const lastestBlock = new Block(Buffer.from(lastestBlockRaw, 'hex'));

    blocks.push({
      hash: lastestBlock.hash().toString('hex'),
      parentHash: lastestBlock.header.parentHash.toString('hex'),
      stateRoot: lastestBlock.header.stateRoot.toString('hex'),
      number: lastestBlock.header.number.toString('hex'),
      timestamp: lastestBlock.header.timestamp.toString('hex')
    });

    let blockChainHeight = new BN(lastestBlock.header.number);
    let index = new BN(lastestBlock.header.number).subn(1);
    let minIndex = blockChainHeight.subn(blocksNum)

    while (index.gten(0) && index.gt(minIndex)) {
      let blockRaw = await getBlockByNumber(url, padToEven(index.toString('hex')));
      let block = new Block(Buffer.from(blockRaw, 'hex'));

      blocks.push({
        hash: block.hash().toString('hex'),
        parentHash: block.header.parentHash.toString('hex'),
        stateRoot: block.header.stateRoot.toString('hex'),
        number: block.header.number.toString('hex'),
        timestamp: block.header.timestamp.toString('hex')
      });

      index.isubn(1);
    }

    blocks.reverse();

    return blocks;
  }
}

/**
   * @param {String} url
   * @param {String} number
   */
const getBlockByNumber = async function(url, number) {
  assert(typeof url === "string", `getBlockByNumber,  should be a String, now is ${typeof url}`);
  assert(typeof number === "string", `getBlockByNumber, number should be a String, now is ${typeof number}`);

  const options = {
    method: "POST",
    uri: `${url}/getBlockByNumber`,
    body: {
      number: number
    },
    json: true // Automatically stringifies the body to JSON
  };

  const promise = new Promise((resolve, reject) => {
    rp(options).then(response => {
      if (response.code !== SUCCESS) {
        reject(response.msg);
      }
      resolve(response.data);
    }).catch(e => {
      reject(e.toString());
    });
  });

  return promise;
}

/**
 * @param {String} url
 */
const getLastestBlock = async function(url) {
  assert(typeof url === "string", `getLastestBlock, url should be a String, now is ${typeof url}`);

  const options = {
    method: "POST",
    uri: `${url}/getLastestBlock`,
    body: {

    },
    json: true // Automatically stringifies the body to JSON
  };

  const promise = new Promise((resolve, reject) => {
    rp(options).then(response => {
      if (response.code !== SUCCESS) {
        reject(response.msg);
      }
      resolve(response.data);
    }).catch(e => {
      reject(e.toString());
    });
  });

  return promise;
}

module.exports = BlockCache;