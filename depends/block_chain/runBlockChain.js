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
  const block = opts.block;
  
  // fetch parent block
  let parentBlock;
  if(!block.isGenesis())
  {
    parentBlock = await this.getBlockByHash(block.header.parentHash);
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
    await this.addBlockChain(block);
    // refresh block height
    await this.updateBlockChainHeight(block.header.number);
  }

  return result;
}
