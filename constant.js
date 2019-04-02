const path = require("path");

//
module.exports.SUCCESS = 0;
module.exports.PARAM_ERR = 1;
module.exports.OTH_ERR = 2;
module.exports.STAGE_INVALID = 3;

//
module.exports.ERR_RUN_BLOCK_TX_PROCESS = 1;

//
module.exports.TRANSACTION_STATE_UNPACKED = 1;
module.exports.TRANSACTION_STATE_PACKED = 2;
module.exports.TRANSACTION_STATE_NOT_EXISTS = 3;

//
module.exports.BLOCK_CHAIN_DATA_DIR = path.join(__dirname, "./block_chain_data");