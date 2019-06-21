const Trie = require('../index.js')
const tape = require('tape')
const utils = require("../../utils");

const Buffer = utils.Buffer;

const trieA = new Trie()
const trieB = new Trie()

const hex = 'FF44A3B3'
tape('encoding hexprefixes ', function (t) {
  trieA.put(Buffer.from(hex, 'hex'), Buffer.from('test'), function () {
    trieB.put(Buffer.from(hex, 'hex'), Buffer.from('test'), function () {
      t.equal(trieA.root.toString('hex'), trieB.root.toString('hex'))
      t.end()
    })
  })
})
