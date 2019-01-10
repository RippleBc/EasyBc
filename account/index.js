const util = require('../util')

const rlp = util.rlp;
const Buffer = util.Buffer;

class Account {
  constructor(data)
  {
    data = data || {};

    // Define Properties
    let fields = [{
      name: "nonce",
      default: Buffer.alloc(0)
    }, {
      name: "balance",
      default: Buffer.alloc(0)
    }, {
      name: "stateRoot",
      length: 32,
      default: util.SHA3_RLP
    }]

    util.defineProperties(this, fields, data);
  }

  /**
   * Returns the rlp encoding of the transaction
   * @method serialize
   * @memberof Transaction
   * @return {Buffer}
   */

  function getStorage(trie, key, cb)
  {
    let t = trie.copy();
    t.root = this.stateRoot;
    t.get(key, cb);
  }

  function setStorage(trie, key, val, cb)
  {
    let self = this;
    let t = trie.copy();
    t.root = self.stateRoot;
    t.put(key, val, function(err) {
      if(err)
      {
        return cb(err);
      }
      self.stateRoot = t.root;
      cb();
    })
  }

  function isEmpty()
  {
    return this.balance.toString("hex") === "" &&
    this.nonce.toString("hex") === "" &&
    this.stateRoot.toString("hex") === util.SHA3_RLP_S;
  }
}

module.exports = Account;