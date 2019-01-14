const Buffer = require('safe-buffer').Buffer
const util = require('../../util')

module.exports = {
  getBlock: function(blockTag, cb) {
    let hash;

    if (Buffer.isBuffer(blockTag)) {
      hash = util.keccak256(blockTag)
    } else if (Number.isInteger(blockTag)) {
      hash = util.keccak256('0x' + util.toBuffer(blockTag).toString('hex'))
    } else {
      return cb(new Error('Unknown blockTag type'))
    }

    var block = {
      hash: function () {
        return hash
      }
    }

    cb(null, block)
  },

  delBlock: function (hash, cb) {
    cb(null)
  }
}
