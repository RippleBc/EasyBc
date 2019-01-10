'use strict'
const Transaction = require('../transaction')
const util = require('../utils')
const Block = require('./')
const blockHeaderFromRpc = require('./header-from-rpc')

module.exports = blockFromRpc

/**
 * Creates a new block object from JSON RPC.
 * @param {Object} blockParams - JSON RPC of block (eth_getBlockByNumber)
 * @param {Array.<Object>} Optional list of JSON RPC of uncles (eth_getUncleByBlockHashAndIndex)
 */
function blockFromRpc (blockParams, uncles) {
  uncles = uncles || []
  const block = new Block({
    transactions: [],
    uncleHeaders: []
  })
  block.header = blockHeaderFromRpc(blockParams)

  block.transactions = (blockParams.transactions || []).map(function (_txParams) {
    const txParams = normalizeTxParams(_txParams)
    // override from address
    const fromAddress = util.toBuffer(txParams.from)
    delete txParams.from
    const tx = new Transaction(txParams)
    tx._from = fromAddress
    tx.getSenderAddress = function () { return fromAddress }
    // override hash
    const txHash = util.toBuffer(txParams.hash)
    tx.hash = function () { return txHash }
    return tx
  })
  block.uncleHeaders = uncles.map(function (uncleParams) {
    return blockHeaderFromRpc(uncleParams)
  })

  return block
}

function normalizeTxParams (_txParams) {
  const txParams = Object.assign({}, _txParams)
  // hot fix for https://github.com/ethereumjs/ethereumjs-util/issues/40
  txParams.gasLimit = (txParams.gasLimit === undefined) ? txParams.gas : txParams.gasLimit
  txParams.data = (txParams.data === undefined) ? txParams.input : txParams.data
  // strict byte length checking
  txParams.to = txParams.to ? util.setLengthLeft(util.toBuffer(txParams.to), 20) : null
  // v as raw signature value {0,1}
  txParams.v = txParams.v < 27 ? txParams.v + 27 : txParams.v
  return txParams
}
