const levelup = require("levelup")
const leveldown = require("leveldown")
const Trie = require("merkle-patricia-tree")
const path = require("path");

module.exports = function()
{
	let dbDir = path.join(__dirname, "./data");
	return levelup(leveldown(dbDir));
}


