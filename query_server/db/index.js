const levelup = require("levelup")
const leveldown = require("leveldown")
const Trie = require("merkle-patricia-tree")
const path = require("path");


let db = undefined;

module.exports = function()
{
	if(!db)
	{
		let dbDir = path.join(__dirname, "./data");
		db = levelup(leveldown(dbDir));
	}
	
	return db;
}


