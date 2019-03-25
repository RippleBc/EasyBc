const initDb = require("../../db")
const Trie = require("merkle-patricia-tree/secure.js")
const util = require("../../utils")

// init block chain
let db = initDb();
let trie = new Trie(db);

console.log(util.baToHexString(trie.root))
