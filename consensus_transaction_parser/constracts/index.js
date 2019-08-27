const Block = require("../../depends/block")
const receiptTrie = process[Symbol.for('receiptTrie')];
const utils = require("../../depends/utils");
const multiSignParse = require("./multi_sign");
const sideChainParse = require("./side_chain");

const rlp = utils.rlp;

/**
 * @param {Block} block 
 */
const parseReceipt = async (block) => {
  
  // init trie root
  receiptTrie.root = block.header.receiptRoot;

  // fetch receipts
  const receipts = [];
  await new Promise((resolve, reject) => {
    var stream = receiptTrie.createReadStream();
    stream.on('data', node => {
      receipts.push(node.value)
    })
    stream.on('end', () => {
      resolve();
    })

    stream.on('error', e => {
      reject(`parseReceipt getReceipts, throw exception, ${e}`)
    })
  });

  // parse
  for (let receipt of receipts)
  {
    await parse(receipt)
  }
}

/**
 * @param {Buffer} event 
 */
const parse = async event => {
  const rawDataArray = rlp.decode(event);
  const [id, name] = rawDataArray;
  rawDataArray.splice(0, 2);

  await multiSignParse(id, name, rawDataArray);
  await sideChainParse(id, name, rawDataArray);
}

module.exports = parseReceipt;