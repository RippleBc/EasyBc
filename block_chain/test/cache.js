const Cache = require("../cache"
const createDb = require("../db")
const Trie = require("merkle-patricia-tree")
const async = require("async")
const assert = require("assert");


let db = createDb();
let trie = new Trie(db);

let cacheInstance = new Cache();

let account1 = new Account();  

cacheInstance.put(["test"