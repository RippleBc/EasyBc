const assert = require('assert')
const Block = require('../block')
const { RUN_BLOCK_CHAIN_SUCCESS, 
  RUN_BLOCK_CHAIN_SOME_TRANSACTIONS_INVALID, 
  RUN_BLOCK_CHAIN_PARENT_BLOCK_NOT_EXIST, 
  RUN_BLOCK_CHAIN_VALIDATE_FAILED } = require("./constants");

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
        state: RUN_BLOCK_CHAIN_PARENT_BLOCK_NOT_EXIST
      }
    }
  }

  // check parentHash and number and transactions
  let result = await block.validate(parentBlock);
  if(false === result.state)
  {
    return {
      state: RUN_BLOCK_CHAIN_VALIDATE_FAILED,
      msg: result.msg
    }
  }

  // run block
  result = await this.runBlock({
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

  return {
    state: result.state === true ? RUN_BLOCK_CHAIN_SUCCESS : RUN_BLOCK_CHAIN_SOME_TRANSACTIONS_INVALID,
    msg: result.msg,
    transactions: result.transactions
  };
}
