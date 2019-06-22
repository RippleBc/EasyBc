const Trie = require('../index.js')
const async = require('async')
const tape = require('tape')
const utils = require('../../utils')

const Buffer = utils.Buffer;

tape('simple merkle proofs generation and verification', function (tester) {
  var it = tester.test
  it('create a merkle proof and verify it', function (t) {
    var trie = new Trie()

    async.series([
      function (cb) {
        trie.put(Buffer.from('key1aa'), Buffer.from('0123456789012345678901234567890123456789xx'), cb)
      },
      function (cb) {
        trie.put(Buffer.from('key2bb'), Buffer.from('aval2'), cb)
      },
      function (cb) {
        trie.put(Buffer.from('key3cc'), Buffer.from('aval3'), cb)
      },
      function (cb) {
        Trie.prove(trie, Buffer.from('key2bb'), function (err, prove) {
          if (err) return cb(err)
          Trie.verifyProof(trie.root, Buffer.from('key2bb'), prove, function (err, val) {
            if (err) return cb(err)
            t.equal(val.toString('utf8'), 'aval2')
            cb()
          })
        })
      },
      function (cb) {
        Trie.prove(trie, Buffer.from('key1aa'), function (err, prove) {
          if (err) return cb(err)
          Trie.verifyProof(trie.root, Buffer.from('key1aa'), prove, function (err, val) {
            if (err) return cb(err)
            t.equal(val.toString('utf8'), '0123456789012345678901234567890123456789xx')
            cb()
          })
        })
      },
      function (cb) {
        Trie.prove(trie, Buffer.from('key2bb'), function (err, prove) {
          if (err) return cb(err)
          Trie.verifyProof(trie.root, Buffer.from('randomkey'), prove, function (err, val) {
            t.notEqual(err, null, 'Expected error: ' + err.message)
            cb()
          })
        })
      },
      function (cb) {
        Trie.prove(trie, Buffer.from('key2bb'), function (err, prove) {
          if (err) return cb(err)
          Trie.verifyProof(trie.root, Buffer.from('key2b'), prove, function (err, val) {
            t.notEqual(err, null, 'Expected error: ' + err.message)
            cb()
          })
        })
      },
      function (cb) {
        Trie.prove(trie, Buffer.from('key2bb'), function (err, prove) {
          if (err) return cb(err)
          prove.push(Buffer.from('123456'))
          Trie.verifyProof(trie.root, Buffer.from('key2b'), prove, function (err, val) {
            t.notEqual(err, null, 'Expected error: ' + err.message)
            cb()
          })
        })
      }
    ], function (err) {
      t.end(err)
    })
  })

  it('create a merkle proof and verify it with a single long key', function (t) {
    var trie = new Trie()

    async.series([
      function (cb) {
        trie.put(Buffer.from('key1aa'), Buffer.from('0123456789012345678901234567890123456789xx'), cb)
      },
      function (cb) {
        Trie.prove(trie, Buffer.from('key1aa'), function (err, prove) {
          if (err) return cb(err)
          Trie.verifyProof(trie.root, Buffer.from('key1aa'), prove, function (err, val) {
            if (err) return cb(err)
            t.equal(val.toString('utf8'), '0123456789012345678901234567890123456789xx')
            cb()
          })
        })
      }
    ], function (err) {
      t.end(err)
    })
  })

  it('create a merkle proof and verify it with a single short key', function (t) {
    var trie = new Trie()

    async.series([
      function (cb) {
        trie.put(Buffer.from('key1aa'), Buffer.from('01234'), cb)
      },
      function (cb) {
        Trie.prove(trie, Buffer.from('key1aa'), function (err, prove) {
          if (err) return cb(err)
          Trie.verifyProof(trie.root, Buffer.from('key1aa'), prove, function (err, val) {
            if (err) return cb(err)
            t.equal(val.toString('utf8'), '01234')
            cb()
          })
        })
      }
    ], function (err) {
      t.end(err)
    })
  })

  it('create a merkle proof and verify it whit keys in the midle', function (t) {
    var trie = new Trie()

    async.series([
      function (cb) {
        trie.put(Buffer.from('key1aa'), Buffer.from('0123456789012345678901234567890123456789xxx'), cb)
      },
      function (cb) {
        trie.put(Buffer.from('key1'), Buffer.from('0123456789012345678901234567890123456789Very_Long'), cb)
      },
      function (cb) {
        trie.put(Buffer.from('key2bb'), Buffer.from('aval3'), cb)
      },
      function (cb) {
        trie.put(Buffer.from('key2'), Buffer.from('short'), cb)
      },
      function (cb) {
        trie.put(Buffer.from('key3cc'), Buffer.from('aval3'), cb)
      },
      function (cb) {
        trie.put(Buffer.from('key3'), Buffer.from('1234567890123456789012345678901'), cb)
      },
      function (cb) {
        Trie.prove(trie, Buffer.from('key1'), function (err, prove) {
          if (err) return cb(err)
          Trie.verifyProof(trie.root, Buffer.from('key1'), prove, function (err, val) {
            if (err) return cb(err)
            t.equal(val.toString('utf8'), '0123456789012345678901234567890123456789Very_Long')
            cb()
          })
        })
      },
      function (cb) {
        Trie.prove(trie, Buffer.from('key2'), function (err, prove) {
          if (err) return cb(err)
          Trie.verifyProof(trie.root, Buffer.from('key2'), prove, function (err, val) {
            if (err) return cb(err)
            t.equal(val.toString('utf8'), 'short')
            cb()
          })
        })
      },
      function (cb) {
        Trie.prove(trie, Buffer.from('key3'), function (err, prove) {
          if (err) return cb(err)
          Trie.verifyProof(trie.root, Buffer.from('key3'), prove, function (err, val) {
            if (err) return cb(err)
            t.equal(val.toString('utf8'), '1234567890123456789012345678901')
            cb()
          })
        })
      }
    ], function (err) {
      t.end(err)
    })
  })

  it('should succeed with a simple embedded extension-branch', function (t) {
    var trie = new Trie()

    async.series([
      (cb) => {
        trie.put(Buffer.from('a'), Buffer.from('a'), cb)
      }, (cb) => {
        trie.put(Buffer.from('b'), Buffer.from('b'), cb)
      }, (cb) => {
        trie.put(Buffer.from('c'), Buffer.from('c'), cb)
      }, (cb) => {
        Trie.prove(trie, Buffer.from('a'), function (err, prove) {
          if (err) return cb(err)
          Trie.verifyProof(trie.root, Buffer.from('a'), prove, function (err, val) {
            if (err) return cb(err)
            t.equal(val.toString('utf8'), 'a')
            cb()
          })
        })
      }, (cb) => {
        Trie.prove(trie, Buffer.from('b'), function (err, prove) {
          if (err) return cb(err)
          Trie.verifyProof(trie.root, Buffer.from('b'), prove, function (err, val) {
            if (err) return cb(err)
            t.equal(val.toString('utf8'), 'b')
            cb()
          })
        })
      }, (cb) => {
        Trie.prove(trie, Buffer.from('c'), function (err, prove) {
          if (err) return cb(err)
          Trie.verifyProof(trie.root, Buffer.from('c'), prove, function (err, val) {
            if (err) return cb(err)
            t.equal(val.toString('utf8'), 'c')
            cb()
          })
        })
      }], function (err) {
      t.end(err)
    })
  })
})
