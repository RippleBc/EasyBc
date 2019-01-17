const async = require("async")
const util = require("../utils")

const BN = util.BN;

/**
 * processes blocks and adds them to the blockchain, blocks should be ordered by block.number like a, a+1, a+1, a+2, a+3 ..., a+n, the block with same block.number is allowed.
 * @param blockchain
 */
module.exports = function(data, cb)
{
  let parentState, parentBlock;

  blockchain = data.blockchain || this.stateManager.blockchain;

  blockchain.eachSeries(data.blocks, processBlock, cb);

  function processBlock(block, cb)
  {
    async.series([
      getStartingState,
      runBlock
    ], cb);

    function getStartingState(cb)
    {
      if(parentBlock)
      {
        parentState = parentBlock.header.stateRoot;
        return cb();
      } 
      
      blockchain.getBlockByHash(block.header.parentHash, function(err, parentBlock) {
        parentState = parentBlock.header.stateRoot;
        cb(err);
      });
    }

    function runBlock(cb)
    {
      self.runBlock({
        block: block,
        root: parentState
      }, function(err, results) {
        if(!!err)
        {
          blockchain.delBlockByHash(block.header.hash(), cb);
        }
        else
        {
          parentBlock = block;
          cb();
        }
      })
    }
  }
}
