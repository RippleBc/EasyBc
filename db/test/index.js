// note!!!! please delte file in dir data

const levelup = require("levelup")
const leveldown = require("leveldown")
const Trie = require("merkle-patricia-tree/secure")
const async = require("async")
const assert = require("assert")
const path = require("path")
const initDb = require("../index.js")
const fs = require("fs");

let trieRoot1 = "0xb9d8383aa98018c00454f43a0a8d74632d1d81ec04747ee9d0caa21c9c23ed24"; // record test 1
let trieRoot2 = "0x1623775a3d081a17e3fa27d4dce063e3dac382414362572a2b20c8b598c0dd2f"; // record test 2
let trieRoot3 = "0xd7bc9196736d3f6f7633c774d5dac4dd318f87cab7932403902e42a214784a60"; // record test 1 and 3

function deleteall(path)
{
  var files = [];
  if(fs.existsSync(path))
  {
    files = fs.readdirSync(path);
    files.forEach(function(file, index)
    {
      var curPath = path + "/" + file;
      if(fs.statSync(curPath).isDirectory())
      { // recurse
        deleteall(curPath);
      } 
      else
      { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

deleteall(path.join(__dirname, "../data"));

let db = initDb();

let test1 = function(cb)
{
  let trie1 = new Trie(db);
  let trie2 = new Trie(db);

  trie1.checkpoint();

  async.waterfall([
    function(cb) {
      trie1.put("test1", "one", function () {
        cb();
      });
    },
    function(cb) {
      let trie1 = new Trie(db, trieRoot1);
      trie1.get("test1", function (err, value) {
        assert(!value, "err");
        cb();
      });
    },
    function(cb) {
      trie1.commit(function() {
        cb();
      });
    },
    function(cb) {
      let trie1 = new Trie(db, trieRoot1);
      trie1.get("test1", function (err, value) {
        assert(value.toString() === "one", "err");
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
        assert(value.toString() === "two", "err");
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
  ], function(err) {
    if(err)
    {
      console.log(err);
      return;
    }
    console.log("test ok!!!");
  });

