const Trie = require("../merkle_patricia_tree");
const utils = require("../utils");
const assert = require("assert");

const Buffer = utils.Buffer;

class ReceiptManager {
  constructor(opts) {
    opts = opts || {};

    this.trie = opts.trie || new Trie();
  }

  /**
   * @param {Buffer} hash
   */
  async getReceipt(hash) {
    assert(Buffer.isBuffer(hash), `ReceiptManager getReceipt, hash should be an Buffer, now is ${typeof hash}`);

    const receipt = await new Promise((resolve, reject) => {
      this.trie.get(hash, (err, result) => {
        if (!!err) {
          reject(err)
        }
        resolve(result)
      });
    })

    return receipt;
  }

  /**
   * @param {Buffer} hash
   * @param {Buffer} receipt
   */
  async putReceipt(hash, receipt) {
    assert(Buffer.isBuffer(hash), `ReceiptManager putReceipt, hash should be an Buffer, now is ${typeof hash}`);
    assert(Buffer.isBuffer(receipt), `ReceiptManager putReceipt, receipt should be an Buffer, now is ${typeof receipt}`);

    await new Promise((resolve, reject) => {
      this.trie.put(hash, receipt, err => {
        if (!!err) {
          reject(err)
        }
        resolve()
      });
    })
  }

  /**
   * @param {Buffer} hash
   */
  async delReceipt(hash) {
    assert(Buffer.isBuffer(hash), `ReceiptManager delReceipt, hash should be an Buffer, now is ${typeof hash}`);

    await new Promise((resolve, reject) => {
      this.trie.del(hash, err => {
        if (!!err) {
          reject(err)
        }
        resolve()
      });
    })
  }

  /*
   * @param {Buffer} root
   */
  async resetTrieRoot(root) {
    assert(Buffer.isBuffer(root), `ReceiptManager resetTrieRoot, root should be an Buffer, now is ${typeof root}`);

    if (root.toString("hex") === utils.SHA3_RLP.toString('hex'))
    {
      this.trie.root = root;

      return;
    }

    const promise = new Promise((resolve, reject) => {
      this.trie.checkRoot(root, (e, ifRootExist) => {
        if (!!e) {
          reject(`ReceiptManager resetTrieRoot, this.trie.checkRoot throw exception, ${e}`);
        }

        if (!ifRootExist) {
          reject(`ReceiptManager resetTrieRoot, root ${root.toString("hex")} is not exist`);
        }

        this.trie.root = root;
        resolve();
      });
    });

    return promise;
  }

  /**
   * @return {Buffer}
   */
  getTrieRoot() {
    return this.trie.root;
  }

  checkpoint() {
    this.trie.checkpoint();
  }

  async commit() {
    const promise = new Promise((resolve, reject) => {
      this.trie.commit(function (err) {
        if (!!err) {
          reject(err);
        }

        resolve();
      });
    });

    return promise;
  }

  async revert() {
    const promise = new Promise((resolve, reject) => {
      this.trie.revert(function (err) {
        if (!!err) {
          reject(err);
        }

        resolve();
      });
    });

    return promise;
  }
}
module.exports = ReceiptManager;