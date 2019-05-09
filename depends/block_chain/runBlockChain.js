const assert = require('assert')
const Block = require('../block')
/**
 * processes block and add to the blockchain
 * @param {Object} opts
 * @prop {Block} opts.block
 * @prop {Boolean} opts.generate
 * @prop {Boolean} opts.skipNonce
 * @prop {Boolean} opts.skipBalance
 */
module.exports = async function(opts)
{
  assert(opts.block instanceof Block, `runBlockChain, opts.block should be an Block, now is ${typeof opts.block}`);

  const block = opts.block;

  // fetch parent block
  let parentBlock;
  if(!block.isGenesis())
  {
    parentBlock = await this.getBlockByHash(block.header.parentHash);
    
    if(!parentBlock)
    {
      return {
          state: false,
          msg: "run block chain, getBlockByHash key not found"
        }
    }
  }

  // check parentHash and number
  await block.validate(parentBlock);

  // run block
  const result = await this.runBlock({
    block: block,
    root: parentBlock ? parentBlock.header.stateRoot : undefined,
    generate: opts.generate,
    skipNonce: opts.skipNonce,
    skipBalance: opts.skipBalance
  });

  if(result.state)
  {
    // add to block chain
    await this.addBlock(block);
  }

  return result;
}
