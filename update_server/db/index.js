const levelup = require("levelup")
const leveldown = require("leveldown")

const { BLOCK_CHAIN_DATA_DIR } = require("../../constant");

const db = levelup(leveldown(BLOCK_CHAIN_DATA_DIR));

module.exports = db;