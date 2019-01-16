const async = require("async")
const util = require("../utils")

const BN = util.BN;

/**
 * processes blocks and adds them to the blockchain
 * @param blockchain
 */
module.exports = function(data, cb)
{
  let parentState, headBlock;

  blockchain = data.blockchain || this.stateManager.blockchain;

  blockchain.eachSeries(data.blocks, processBlock, cb);

  function processBlock(block, reorg, cb)
  {
    async.series([
      getStartingState,
      runBlock
    ], cb);

    function getStartingState(cb)
    {
      if(headBlock)
      {
        parentState = headBlock.header.stateRoot;
        cb();
      } 
      else
      {
        blockchain.getBlock(block.header.parentHash, function(err, parentBlock) {
          parentState = parentBlock.header.stateRoot;
          cb(err);
        });
      }
    }

    function runBlock(cb)
    {
      self.runBlock({
        block: block,
        root: parentState
      }, function (err, results) {
        if(!!err)
        {
          blockchain.delBlockByHash(block.header.hash(), cb);
        }
        else
        {
          headBlock = block;
          cb();
        }
      })
    }
  }
}
