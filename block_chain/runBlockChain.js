// const async = require("async")

// /**
//  * processes blocks and adds them to the blockchain
//  * @param blockchain
//  */
// module.exports = function(blockchain, cb)
// {
//   const self = this
//   let headBlock, parentState

//   if (typeof blockchain === "function")
//   {
//     cb = blockchain;
//     blockchain = undefined;
//   }

//   blockchain = blockchain || self.stateManager.blockchain;

//   async.waterfall([
//     function(cb) {
//       blockchain.getMaxBlockNumber(cb);
//     },
//     function(maxBlockNumber, cb) {
//       if(util.bufferToInt(maxBlockNumber) == 0)
//       {
//         cb();
//       }
//       processBlocks(maxBlockNumber, cb);
//     }]);
//   // setup blockchain iterator
//   blockchain.iterator("vm", processBlock, cb);
//   function processBlock(block, reorg, cb)
//   {
//     async.series([
//       getStartingState,
//       runBlock
//     ], cb)

//     // 获取stateRoot的值
//     function getStartingState (cb)
//     {
//       // headBlock（当前正在处理的block的parentBlock）不存在或者
//       if (!headBlock || reorg) {
//         // 从blockChain中获取headBlock
//         blockchain.getBlock(block.header.parentHash, function(err, parentBlock) {
//           parentState = parentBlock.header.stateRoot
//           // generate genesis state if we are at the genesis block
//           // we don't have the genesis state
//           if (!headBlock) {
//             return self.stateManager.generateCanonicalGenesis(cb)
//           } else {
//             cb(err)
//           }
//         })
//       } else {
//         parentState = headBlock.header.stateRoot
//         cb()
//       }
//     }

//     function runBlock(cb)
//     {
//       self.runBlock({
//         block: block,
//         root: parentState
//       }, function (err, results) {
//         if(err)
//         {
//           console.info("runBlockchain, Invalid block error:", err);
//           blockchain.delBlock(block.header.hash(), cb);
//         }
//         else
//         {
//           // set as new head block
//           headBlock = block
//           cb();
//         }
//       })
//     }
//   }
// }
