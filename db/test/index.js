const levelup = require("levelup")
const leveldown = require("leveldown")
const Trie = require("merkle-patricia-tree")
const async = require("async")
const assert = require("assert");
const path = require("path");

let trieRoot1 = "0xe0bddcccb34cd258d69e1c1567df0791d0d039f42b605f8082b9668077f8997b"; // record test 1
let trieRoot2 = "0x445c63b541022de29144d08264159a7e260fcf3a19b50d4d89cf8cfa0d3dc15d"; // record test 2
let trieRoot3 = "0x61298aaec6f3d5e5e677bd461abea8d099229c73ec812e5d51c60c7e74e8609d"; // record test 1 and 3

let dbDir = path.join(__dirname, "../data");
let db = levelup(leveldown(dbDir));

let test1 = function(cb)
{
  let trie1 = new Trie(db);
  let trie2 = new Trie(db);
  async.waterfall([
    function(cb) {
      trie1.put("test1", "one", function () {
        console.log(trie1.root.toString("hex"));
        cb();
      });
    },
    function(cb) {
      trie2.put("test2", "two", function () {
        cb();
      });
    }], cb);
}

let test2 = function(cb)
{
  let trie1 = new Trie(db, trieRoot1);
  let trie2 = new Trie(db, trieRoot2);
  async.waterfall([
    function(cb) {
      trie1.get("test1", function (err, value) {
        assert(value.toString() === "one", "err");
        cb();
      });
    },
    function(cb) {
      trie1.get("test2", function (err, value) {
        assert(!value, "err");
        cb();
      });
    },
    function(cb) {
      trie2.get("test1", function (err, value) {
        assert(!value, "err");
        cb();
      });
    },
    function(cb) {
      trie2.get("test2", function (err, value) {
        assert(value.toString() == "two", "err");
        cb();
      });
    }], cb);
}

let test3 = function(cb)
{
  let trie = new Trie(db, trieRoot1);

  trie.put("test3", "three", function () {
    cb();
  });
}

let test4 = function(cb)
{
  let trie1 = new Trie(db, trieRoot3);
  let trie2 = new Trie(db, trieRoot1);

  async.waterfall([
    function(cb) {
      trie1.get("test1", function (err, value) {
        assert(value.toString() === "one", "err");
        cb();
      });
    },
    function(cb) {
      trie1.get("test2", function (err, value) {
        assert(!value, "err");
        cb();
      });
    },
    function(cb) {
      trie1.get("test3", function (err, value) {
        assert(value.toString() === "three", "err");
        cb();
      });
    },
    function(cb) {
      trie2.get("test1", function (err, value) {
        assert(value.toString() === "one", "err");
        cb();
      })
    },
    function(cb) {
      trie2.get("test3", function (err, value) {
        assert(!value, "err");
        cb();
      });
    }], cb);
}

async.waterfall([
  function(cb) {
    test1(cb);
  },
  function(cb) {
    test2(cb);
  },
  function(cb) {
    test3(cb);
  },
  function(cb) {
    test4(cb);
  }
  ], function() {
    console.log("test ok");
  });

